import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/db/prisma.service';

jest.setTimeout(30000);

describe('Continuum core flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = `e2e-${Date.now()}@example.com`;
  const password = 'Passw0rd!';
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => undefined);
    }
    await app.close();
  });

  it('rejects registration with an invalid password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'short' })
      .expect(400);
  });

  it('registers a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    expect(res.body.user.email).toBe(email);
    expect(res.body.accessToken).toEqual(expect.any(String));
    userId = res.body.user.id;
  });

  it('rejects a duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(409);
  });

  it('rejects login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassw0rd' })
      .expect(401);
  });

  it('logs in and receives a token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(res.body.accessToken).toEqual(expect.any(String));
    accessToken = res.body.accessToken;
  });

  it('rejects unauthenticated access to a protected route', async () => {
    await request(app.getHttpServer()).get('/api/habits').expect(401);
  });

  let habitId: string;

  it('creates a habit for the logged-in user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Baca 20 menit', frequency: 'daily' })
      .expect(201);

    expect(res.body.data.name).toBe('Baca 20 menit');
    expect(res.body.data.currentStreak).toBe(0);
    habitId = res.body.data.id;
  });

  it('checks the habit in for today and starts a streak', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/habits/${habitId}/checkin`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(res.body.idempotent).toBe(false);
    expect(res.body.data.currentStreak).toBe(1);
  });

  it('is idempotent when checked in twice on the same day', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/habits/${habitId}/checkin`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);

    expect(res.body.idempotent).toBe(true);
  });

  it('lists the habit back for the owner', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(habitId);
  });

  it('logs out and revokes the refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });
});
