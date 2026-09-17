import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';

/**
 * Generic idempotency-key support for write endpoints that don't have a
 * natural uniqueness constraint to lean on (unlike habit checkins, which are
 * naturally idempotent via the (habitId, checkinDate) unique index).
 *
 * A client resending the same request (e.g. after a network timeout) with
 * the same `Idempotency-Key` header gets back the exact same response
 * instead of creating a duplicate record.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    userId: string,
    key: string | undefined,
    endpoint: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!key) return fn();

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { userId_key_endpoint: { userId, key, endpoint } },
    });
    if (existing) return existing.responseBody as T;

    const result = await fn();

    try {
      await this.prisma.idempotencyKey.create({
        data: { userId, key, endpoint, responseBody: result as object, statusCode: 201 },
      });
    } catch {
      // A concurrent retry raced us and inserted first — the DB unique
      // constraint on (userId, key, endpoint) prevents a duplicate row.
      // The already-created business record still stands; nothing to undo.
    }

    return result;
  }
}
