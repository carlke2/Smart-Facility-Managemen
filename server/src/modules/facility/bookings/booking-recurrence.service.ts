import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RECURRENCE_QUEUE } from '../../../queue/queue.constants';

@Injectable()
export class BookingRecurrenceService {
  private readonly logger = new Logger(BookingRecurrenceService.name);

  constructor(
    @InjectQueue(RECURRENCE_QUEUE) private readonly recurrenceQueue: Queue,
  ) {}

  /**
   * Enqueues the recurring booking expansion job every night at midnight.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRecurringBookingsJob() {
    this.logger.log('[RECURRING BOOKINGS] Enqueuing nightly expansion job...');
    await this.recurrenceQueue.add('expand-recurring-bookings', {}, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
