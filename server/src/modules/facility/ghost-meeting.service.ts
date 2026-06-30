import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { GHOST_MEETING_QUEUE } from '../../queue/queue.constants';

@Injectable()
export class GhostMeetingService {
  private readonly logger = new Logger(GhostMeetingService.name);

  constructor(
    @InjectQueue(GHOST_MEETING_QUEUE) private readonly ghostMeetingQueue: Queue,
  ) {}

  /**
   * Heartbeat task that runs every 5 minutes.
   * Enqueues a job to compare active bookings with real-time sensor occupancy data.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleGhostMeetingDetection() {
    this.logger.log('[HEARTBEAT] Enqueuing Ghost Meeting detection job...');
    await this.ghostMeetingQueue.add('detect-ghost-meetings', {}, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
