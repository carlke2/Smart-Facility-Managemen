import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { AI_INTEGRATION_QUEUE } from '../../queue/queue.constants';
import { firstValueFrom } from 'rxjs';
import { TicketCategory } from '@prisma/client';

@Processor(AI_INTEGRATION_QUEUE)
export class AiGatewayProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGatewayProcessor.name);
  
  // Future URL when FastAPI is deployed:
  // private readonly aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      if (job.name === 'predict-no-show') {
        return await this.handleNoShowPrediction(job.data.bookingId);
      }
      
      if (job.name === 'categorize-ticket') {
        return await this.handleTicketCategorization(job.data.ticketId, job.data.description);
      }
    } catch (error) {
      this.logger.error(`[AI GATEWAY] Failed to process ${job.name}: ${(error as Error).message}`);
      throw error; // Let BullMQ handle retries
    }
  }

  private async handleNoShowPrediction(bookingId: string) {
    this.logger.log(`[AI GATEWAY] Executing no-show prediction for booking ${bookingId}`);
    
    // Simulate HTTP delay to FastAPI Service
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock response from FastAPI
    const mockResponse = { probability: 0.15, factors: ['past_attendance', 'time_of_day'] };

    // In the future, this will be:
    // const response = await firstValueFrom(this.httpService.post(`${this.aiServiceUrl}/predict/no-show`, { bookingId }));
    // const result = response.data;

    // Save the AI Insight to the database
    const insight = await this.prisma.aiInsight.create({
      data: {
        entityType: 'Booking',
        entityId: bookingId,
        insightType: 'NO_SHOW_PREDICTION',
        prediction: mockResponse,
        confidence: 0.85, // 1 - probability of no-show
        status: 'SUCCESS',
      },
    });

    this.logger.log(`[AI GATEWAY] Saved No-Show Insight: ${insight.id}`);
    return insight;
  }

  private async handleTicketCategorization(ticketId: string, description: string) {
    this.logger.log(`[AI GATEWAY] Executing categorization for ticket ${ticketId}`);
    
    // Simulate HTTP delay to FastAPI Service
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock response from FastAPI
    const mockResponse = { category: 'HARDWARE', confidence: 0.92 };

    // In the future, this will be:
    // const response = await firstValueFrom(this.httpService.post(`${this.aiServiceUrl}/predict/ticket-category`, { description }));
    // const result = response.data;

    // Save the AI Insight to the database
    const insight = await this.prisma.aiInsight.create({
      data: {
        entityType: 'Ticket',
        entityId: ticketId,
        insightType: 'TICKET_CATEGORY',
        prediction: mockResponse,
        confidence: mockResponse.confidence,
        status: 'SUCCESS',
      },
    });

    this.logger.log(`[AI GATEWAY] Saved Ticket Category Insight: ${insight.id}`);
    
    // Optional: We can automatically apply this insight back to the ticket if confidence > 0.90
    if (mockResponse.confidence >= 0.90) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { category: mockResponse.category as TicketCategory },
      });
      
      await this.prisma.aiInsight.update({
        where: { id: insight.id },
        data: { isApplied: true },
      });
      
      this.logger.log(`[AI GATEWAY] Automatically applied category ${mockResponse.category} to ticket ${ticketId}`);
    }

    return insight;
  }
}
