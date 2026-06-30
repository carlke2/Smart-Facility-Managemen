import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { ACTIVITY_QUEUE } from '../../queue/queue.constants';
import { LogActivityParams } from './activity.service';

@Processor(ACTIVITY_QUEUE)
export class ActivityProcessor extends WorkerHost {
  private readonly logger = new Logger(ActivityProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<LogActivityParams, any, string>): Promise<any> {
    if (job.name === 'write-activity-log') {
      const { action, entityType, entityId, userId, metadata, ipAddress, userAgent } = job.data;
      
      this.logger.debug(`[ACTIVITY LOG] Writing: ${action} on ${entityType}`);

      const record = await this.prisma.activityLog.create({
        data: {
          action,
          entityType,
          entityId,
          userId,
          metadata: metadata ?? {},
          ipAddress,
          userAgent,
        },
      });

      return { success: true, logId: record.id };
    }
  }
}
