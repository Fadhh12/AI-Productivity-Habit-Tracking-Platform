import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { isValidAvatarDataUrl, normalizeDisplayName } from './profile.util';

/** A small allowlist check so a typo doesn't silently store a bogus timezone that later breaks date math. */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const PROFILE_SELECT = {
  id: true,
  email: true,
  timezone: true,
  proactiveInsights: true,
  displayName: true,
  avatar: true,
  createdAt: true,
} as const;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: PROFILE_SELECT });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.timezone && !isValidTimezone(dto.timezone)) {
      throw new BadRequestException(`"${dto.timezone}" is not a recognized IANA timezone`);
    }
    if (typeof dto.avatar === 'string' && !isValidAvatarDataUrl(dto.avatar)) {
      throw new BadRequestException('Foto profil harus berupa gambar JPEG, PNG, atau WebP yang kecil.');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        timezone: dto.timezone,
        proactiveInsights: dto.proactiveInsights,
        displayName: dto.displayName === undefined ? undefined : normalizeDisplayName(dto.displayName),
        avatar: dto.avatar,
      },
      select: PROFILE_SELECT,
    });
  }
}
