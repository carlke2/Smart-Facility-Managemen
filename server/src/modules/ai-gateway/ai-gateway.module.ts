import { Module } from '@nestjs/common';
import { AiGatewayService } from './ai-gateway.service';
import { AiGatewayController } from './ai-gateway.controller';

/**
 * AiGatewayModule — PLACEHOLDER
 * This module is the defined integration boundary between the NestJS backend
 * and the future Python FastAPI AI microservice.
 *
 * Future AI capabilities this gateway will proxy:
 * - No-show prediction for bookings
 * - Intelligent ticket categorization and routing
 * - Anomaly detection in support patterns
 * - Facility usage forecasting
 * - Natural language support interface
 *
 * Integration pattern:
 * - NestJS forwards requests to FastAPI via HTTP (using @nestjs/axios)
 * - FastAPI reads from the shared PostgreSQL DB and/or a dedicated AI data store
 * - Results are returned through this gateway to the main API consumers
 */
@Module({
  controllers: [AiGatewayController],
  providers: [AiGatewayService],
})
export class AiGatewayModule {}
