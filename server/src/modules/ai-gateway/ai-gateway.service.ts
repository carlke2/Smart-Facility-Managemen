import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AI_INTEGRATION_QUEUE } from '../../queue/queue.constants';

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    @InjectQueue(AI_INTEGRATION_QUEUE) private readonly aiQueue: Queue,
  ) {}

  /**
   * Enqueue a no-show prediction request for a booking.
   */
  async predictNoShow(bookingId: string): Promise<void> {
    this.logger.log(`Enqueuing no-show prediction for booking: ${bookingId}`);
    await this.aiQueue.add('predict-no-show', { bookingId }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  /**
   * Enqueue a ticket auto-categorization request.
   */
  async categorizeTicket(ticketId: string, description: string): Promise<void> {
    this.logger.log(`Enqueuing categorization for ticket: ${ticketId}`);
    await this.aiQueue.add('categorize-ticket', { ticketId, description }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }
}
