import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infra/db/prisma.service';

jest.mock('argon2');
const mockedArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    refreshToken: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let service: AuthService;

  const CONFIG: Record<string, string> = {
    'jwt.accessSecret': 'access-secret',
    'jwt.accessExpiresIn': '15m',
    'jwt.refreshSecret': 'refresh-secret',
    'jwt.refreshExpiresIn': '7d',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      refreshToken: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    configService = {
      get: jest.fn((key: string) => CONFIG[key]),
    } as unknown as jest.Mocked<ConfigService>;

    mockedArgon2.hash.mockResolvedValue('hashed');

    service = new AuthService(prisma as unknown as PrismaService, jwtService, configService);
  });

  describe('register', () => {
    it('rejects an email that is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

      await expect(service.register({ email: 'a@a.com', password: 'pw123456' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password, creates the user, and issues a token pair', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'a@a.com',
        timezone: 'UTC',
        createdAt: new Date('2026-01-01'),
      });

      const result = await service.register({ email: 'a@a.com', password: 'pw123456' });

      expect(mockedArgon2.hash).toHaveBeenCalledWith('pw123456');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@a.com', passwordHash: 'hashed', timezone: 'UTC' },
      });
      expect(result.user).toEqual({
        id: 'u1',
        email: 'a@a.com',
        timezone: 'UTC',
        createdAt: new Date('2026-01-01'),
      });
      expect(result.accessToken).toBe('signed-token');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'nope@a.com', password: 'pw123456' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: 'hashed' });
      mockedArgon2.verify.mockResolvedValue(false);

      await expect(service.login({ email: 'a@a.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('issues a token pair on correct credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@a.com',
        passwordHash: 'hashed',
        timezone: 'UTC',
        createdAt: new Date('2026-01-01'),
      });
      mockedArgon2.verify.mockResolvedValue(true);

      const result = await service.login({ email: 'a@a.com', password: 'pw123456' });
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('refresh', () => {
    it('rejects a token that fails JWT verification', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad signature'));
      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when no stored refresh token matches the hash', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@a.com' });
      prisma.refreshToken.findMany.mockResolvedValue([]);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a matched token that has already expired', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@a.com' });
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt1', tokenHash: 'h1', expiresAt: new Date(Date.now() - 1000) },
      ]);
      mockedArgon2.verify.mockResolvedValue(true);

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the token: revokes the used one and issues a fresh pair', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'u1', email: 'a@a.com' });
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 'rt1', tokenHash: 'h1', expiresAt: new Date(Date.now() + 100000) },
      ]);
      mockedArgon2.verify.mockResolvedValue(true);

      const result = await service.refresh('token');

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(result.accessToken).toBe('signed-token');
    });
  });

  describe('logout', () => {
    it('revokes every active refresh token for the user', async () => {
      await service.logout('u1');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
