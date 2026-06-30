import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingRecurrenceService } from './booking-recurrence.service';
import { BookingRecurrenceProcessor } from './booking-recurrence.processor';
import { DatabaseModule } from '../../../database/database.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { RECURRENCE_QUEUE } from '../../../queue/queue.constants';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
    BullModule.registerQueue({ name: RECURRENCE_QUEUE }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingRecurrenceService, BookingRecurrenceProcessor],
  exports: [BookingsService],
})
export class BookingsModule {}
