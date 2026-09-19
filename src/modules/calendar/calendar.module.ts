import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarRepository } from './calendar.repository';
import { CalendarSyncScheduler } from './calendar-sync.scheduler';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [JwtModule.register({}), NotificationModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarRepository, CalendarSyncScheduler],
})
export class CalendarModule {}
