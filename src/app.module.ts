import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { PrismaModule } from './infra/db/prisma.module';
import { RedisCacheModule } from './infra/cache/redis.module';
import { QueueModule } from './infra/queue/queue.module';
import { RequestIdMiddleware } from './shared/middleware/request-id.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { ActivityModule } from './modules/activity/activity.module';
import { HabitModule } from './modules/habit/habit.module';
import { GoalModule } from './modules/goal/goal.module';
import { NotificationModule } from './modules/notification/notification.module';
import { RollupModule } from './modules/rollup/rollup.module';
import { AiModule } from './modules/ai/ai.module';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        throttlers: [
          {
            ttl: Number(process.env.THROTTLE_TTL_MS ?? 60000),
            limit: Number(process.env.THROTTLE_LIMIT ?? 120),
          },
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    RedisCacheModule,
    QueueModule,
    AuthModule,
    CategoryModule,
    ActivityModule,
    HabitModule,
    GoalModule,
    NotificationModule,
    RollupModule,
    AiModule,
    UserModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
