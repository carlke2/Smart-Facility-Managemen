import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NOTIFICATION_QUEUE } from '../../queue/queue.constants';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === 'dispatch-notification') {
      this.logger.log(`Processing external notification dispatch for Job ID: ${job.id}`);
      
      const { userId, type, title, body, metadata } = job.data;
      
      // Simulate API calls to email/SMS providers (e.g. SendGrid, Twilio)
      this.logger.debug(`[EXTERNAL DISPATCH SIMULATION] -> To: User ${userId} | Type: ${type}`);
      this.logger.debug(`Subject: ${title}`);
      this.logger.debug(`Body: ${body}`);
      if (metadata) {
        this.logger.debug(`Metadata: ${JSON.stringify(metadata)}`);
      }

      // In a real production system, this is where you'd integrate the actual
      // delivery mechanisms. For Phase 2, successful processing is enough.
      
      return { success: true, deliveredAt: new Date().toISOString() };
    }
  }
}
