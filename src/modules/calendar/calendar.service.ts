import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { calendar_v3, google } from 'googleapis';
import { CalendarRepository } from './calendar.repository';
import { NotificationService } from '../notification/notification.service';
import { encryptSecret, decryptSecret } from '../../shared/utils/secret-crypto.util';
import { StructuredLogger } from '../../shared/utils/structured-logger';

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const STATE_TTL = '10m';

export interface CalendarStatus {
  available: boolean;
  connected: boolean;
  lastSyncedAt: Date | null;
}

export interface SyncResult {
  imported: number;
  total: number;
}

@Injectable()
export class CalendarService {
  constructor(
    private readonly repository: CalendarRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
  ) {}

  isConfigured(): boolean {
    const cfg = this.configService.get('googleCalendar');
    return Boolean(cfg?.clientId && cfg?.clientSecret && cfg?.redirectUri);
  }

  private buildOAuthClient() {
    const cfg = this.configService.get('googleCalendar');
    return new google.auth.OAuth2(cfg.clientId, cfg.clientSecret, cfg.redirectUri);
  }

  private encryptionKey(): string {
    return this.configService.get<string>('googleCalendar.tokenEncryptionKey')!;
  }

  async getAuthUrl(userId: string): Promise<{ available: boolean; url?: string }> {
    if (!this.isConfigured()) return { available: false };

    const state = await this.jwtService.signAsync(
      { sub: userId },
      { secret: this.configService.get<string>('jwt.accessSecret'), expiresIn: STATE_TTL },
    );

    const client = this.buildOAuthClient();
    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: SCOPES,
      state,
    });

    return { available: true, url };
  }

  /** Exchanges the OAuth `code` from Google's redirect for tokens and persists them. Returns the userId embedded in `state` so the controller can redirect back to the app. */
  async handleCallback(code: string, state: string): Promise<string> {
    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(state, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired OAuth state');
    }

    const client = this.buildOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new UnauthorizedException('Google did not return the expected OAuth tokens');
    }

    const key = this.encryptionKey();
    await this.repository.upsert(payload.sub, {
      accessToken: encryptSecret(tokens.access_token, key),
      refreshToken: encryptSecret(tokens.refresh_token, key),
      expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
    });

    return payload.sub;
  }

  async getStatus(userId: string): Promise<CalendarStatus> {
    const row = await this.repository.findByUserId(userId);
    return {
      available: this.isConfigured(),
      connected: Boolean(row),
      lastSyncedAt: row?.lastSyncedAt ?? null,
    };
  }

  async disconnect(userId: string): Promise<{ success: true }> {
    await this.repository.delete(userId);
    return { success: true };
  }

  async syncForUser(userId: string, from?: Date, to?: Date): Promise<SyncResult> {
    const row = await this.repository.findByUserId(userId);
    if (!row) {
      throw new NotFoundException('Google Calendar is not connected for this account');
    }

    const key = this.encryptionKey();
    const client = this.buildOAuthClient();
    client.setCredentials({
      access_token: decryptSecret(row.accessToken, key),
      refresh_token: decryptSecret(row.refreshToken, key),
      expiry_date: row.expiresAt.getTime(),
    });

    // googleapis auto-refreshes the access token via the refresh token when expired;
    // persist the new one so the next sync doesn't have to refresh again.
    client.on('tokens', (refreshed) => {
      if (!refreshed.access_token) return;
      this.repository
        .upsert(userId, {
          accessToken: encryptSecret(refreshed.access_token, key),
          refreshToken: encryptSecret(
            refreshed.refresh_token ?? decryptSecret(row.refreshToken, key),
            key,
          ),
          expiresAt: new Date(refreshed.expiry_date ?? Date.now() + 3600_000),
        })
        .catch((error) =>
          StructuredLogger.error({
            message: 'Failed to persist refreshed Google Calendar tokens',
            userId,
            errorType: (error as Error).constructor?.name ?? 'Error',
            stack: (error as Error).stack,
          }),
        );
    });

    const timeMin = from ?? new Date(Date.now() - 86400_000);
    const timeMax = to ?? new Date(Date.now() + 7 * 86400_000);

    const calendarApi = google.calendar({ version: 'v3', auth: client });
    const { data } = await calendarApi.events.list({
      calendarId: row.calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });

    const events = data.items ?? [];
    let imported = 0;
    for (const event of events) {
      if (event.status === 'cancelled' || !event.id) continue;
      const range = this.eventTimeRange(event);
      if (!range) continue;

      await this.repository.upsertImportedActivity(userId, event.id, {
        title: event.summary || '(Tanpa judul)',
        startTime: range.start,
        endTime: range.end,
        note: event.description ? event.description.slice(0, 500) : null,
      });
      imported += 1;
    }

    await this.repository.updateLastSyncedAt(userId, new Date());

    if (imported > 0) {
      await this.notificationService.notify(
        userId,
        'calendar_sync',
        `${imported} aktivitas berhasil diimpor dari Google Calendar.`,
      );
    }

    return { imported, total: events.length };
  }

  private eventTimeRange(event: calendar_v3.Schema$Event): { start: Date; end: Date } | null {
    if (event.start?.dateTime && event.end?.dateTime) {
      return { start: new Date(event.start.dateTime), end: new Date(event.end.dateTime) };
    }
    if (event.start?.date && event.end?.date) {
      // All-day event: Google's end.date is already the exclusive next day.
      return {
        start: new Date(`${event.start.date}T00:00:00.000Z`),
        end: new Date(`${event.end.date}T00:00:00.000Z`),
      };
    }
    return null;
  }
}
