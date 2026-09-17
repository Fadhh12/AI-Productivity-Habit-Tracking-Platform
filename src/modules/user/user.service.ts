import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/db/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

/** A small allowlist check so a typo doesn't silently store a bogus timezone that later breaks date math. */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  findMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, timezone: true, createdAt: true },
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    if (dto.timezone && !isValidTimezone(dto.timezone)) {
      throw new BadRequestException(`"${dto.timezone}" is not a recognized IANA timezone`);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { timezone: dto.timezone },
      select: { id: true, email: true, timezone: true, createdAt: true },
    });
  }
}
