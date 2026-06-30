import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
import { AI_INFERENCE_QUEUE } from './ai.constants';

@Processor(AI_INFERENCE_QUEUE)
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);

  constructor(private readonly aiService: AiService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      this.logger.debug(`[AI PROCESSOR] Starting job ${job.name} (ID: ${job.id})`);

      switch (job.name) {
        case 'classify-ticket':
          return await this.aiService.processTicketClassification(job.data);
        case 'suggest-priority':
          return await this.aiService.processTicketPriority(job.data);
        case 'predict-no-show':
          return await this.aiService.processNoShowPrediction(job.data);
        default:
          this.logger.warn(`[AI PROCESSOR] Unknown job type: ${job.name}`);
      }
    } catch (error) {
      // The worker catches the error but throws it again so BullMQ knows it failed
      // and can trigger the exponential backoff retry.
      this.logger.error(`[AI PROCESSOR] Job ${job.name} failed: ${(error as Error).message}`);
      throw error;
    }
  }
}
