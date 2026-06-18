import { Injectable, Logger } from '@nestjs/common';

/**
 * AiGatewayService — PLACEHOLDER
 * Acts as the HTTP client proxy to the future FastAPI AI microservice.
 * Returns mocked/stub data until FastAPI service is live.
 */
@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  // TODO: Inject HttpService from @nestjs/axios when FastAPI is ready
  // private readonly aiServiceUrl = this.configService.get('AI_SERVICE_URL');

  async predictNoShow(bookingId: string): Promise<{ probability: number }> {
    this.logger.log(`[AI STUB] predictNoShow called for bookingId: ${bookingId}`);
    return { probability: 0.0 }; // Stub
  }

  async categorizeTicket(description: string): Promise<{ category: string; confidence: number }> {
    this.logger.log(`[AI STUB] categorizeTicket called`);
    return { category: 'OTHER', confidence: 0.0 }; // Stub
  }

  async forecastRoomDemand(roomId: string): Promise<{ forecast: any[] }> {
    this.logger.log(`[AI STUB] forecastRoomDemand called for roomId: ${roomId}`);
    return { forecast: [] }; // Stub
  }
}
