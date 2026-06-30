import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SLA_MONITOR_QUEUE } from '../../../queue/queue.constants';

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);

  constructor(
    @InjectQueue(SLA_MONITOR_QUEUE) private readonly slaMonitorQueue: Queue,
  ) {}

  /**
   * Enqueues the SLA Monitor job every 5 minutes.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSlaMonitorJob() {
    this.logger.log('[SLA MONITOR] Enqueuing SLA Monitor job...');
    await this.slaMonitorQueue.add('check-sla-breaches', {}, {
      removeOnComplete: true,
      removeOnFail: false,
    });
  }
}
