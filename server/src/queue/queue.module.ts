import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  NOTIFICATION_QUEUE,
  ACTIVITY_QUEUE,
  SLA_MONITOR_QUEUE,
  GHOST_MEETING_QUEUE,
  RECURRENCE_QUEUE,
  AI_INTEGRATION_QUEUE,
} from './queue.constants';

/**
 * QueueModule — Foundation for background job processing.
 * Uses BullMQ backed by Redis.
 *
 * Current queues:
 *  - notification-queue: Email, in-app, and SMS dispatch jobs
 *  - activity-queue: Audit log write jobs (non-blocking writes)
 *  - sla-monitor-queue: SLA breach detection for tickets
 *  - ghost-meeting-queue: Detect booked but empty rooms
 *
 * Adding a new queue: register it in BullModule.registerQueue below
 * and add its name constant to queue.constants.ts
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: ACTIVITY_QUEUE },
      { name: SLA_MONITOR_QUEUE },
      { name: GHOST_MEETING_QUEUE },
      { name: RECURRENCE_QUEUE },
      { name: AI_INTEGRATION_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
