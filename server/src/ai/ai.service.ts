import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { AIInsightSourceType, AIInsightCapability, AIInsightStatus } from '@prisma/client';
import { AiClient } from './ai.client';
import { AI_INFERENCE_QUEUE } from './ai.constants';
import { AiBaseResponse } from './ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectQueue(AI_INFERENCE_QUEUE) private readonly aiQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClient,
  ) {}

  // --- Queue Dispatchers (Fire and Forget from Workflows) ---

  async enqueueTicketClassification(ticketId: string, description: string): Promise<void> {
    await this.aiQueue.add('classify-ticket', { ticketId, description });
  }

  async enqueueTicketPriority(ticketId: string, category: string, description: string): Promise<void> {
    await this.aiQueue.add('suggest-priority', { ticketId, category, description });
  }

  async enqueueNoShowPrediction(bookingId: string): Promise<void> {
    await this.aiQueue.add('predict-no-show', { bookingId });
  }

  // --- Core Processing Logic (Called by Processor) ---

  async processTicketClassification(payload: any) {
    this.logger.log(`Processing classify-ticket for ticket ${payload.ticketId}`);
    // 1. Call Client
    const response = await this.aiClient.classifyTicket(payload);
    // 2. Save Insight
    return this.saveInsight('TICKET', payload.ticketId, 'TICKET_CLASSIFICATION', payload, response);
  }

  async processTicketPriority(payload: any) {
    this.logger.log(`Processing suggest-priority for ticket ${payload.ticketId}`);
    const response = await this.aiClient.suggestPriority(payload);
    return this.saveInsight('TICKET', payload.ticketId, 'PRIORITY_SUGGESTION', payload, response);
  }

  async processNoShowPrediction(payload: any) {
    this.logger.log(`Processing predict-no-show for booking ${payload.bookingId}`);
    const response = await this.aiClient.predictNoShow(payload);
    return this.saveInsight('BOOKING', payload.bookingId, 'NO_SHOW_PREDICTION', payload, response);
  }

  // --- Persistence ---

  private async saveInsight(
    sourceType: AIInsightSourceType,
    sourceId: string,
    capability: AIInsightCapability,
    inputSnapshot: any,
    response: AiBaseResponse<any>,
  ) {
    return this.prisma.aiInsight.create({
      data: {
        sourceType,
        sourceId,
        capability,
        inputSnapshot,
        output: response as any,
        confidence: response.confidence,
        recommendation: response.recommendation as any,
        explanation: response.explanation,
        modelVersion: response.modelVersion,
        correlationId: response.correlationId,
        status: response.success ? 'COMPLETED' : 'FAILED',
      },
    });
  }

  // --- Human Overrides ---

  async acceptInsight(insightId: string, userId: string) {
    const insight = await this.prisma.aiInsight.findUnique({ where: { id: insightId } });
    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { status: 'ACCEPTED', acceptedByUserId: userId },
    });
  }

  async overrideInsight(insightId: string, userId: string, overrideReason: string) {
    const insight = await this.prisma.aiInsight.findUnique({ where: { id: insightId } });
    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { status: 'OVERRIDDEN', overriddenByUserId: userId, overrideReason },
    });
  }

  async ignoreInsight(insightId: string) {
    const insight = await this.prisma.aiInsight.findUnique({ where: { id: insightId } });
    if (!insight) throw new NotFoundException('Insight not found');

    return this.prisma.aiInsight.update({
      where: { id: insightId },
      data: { status: 'IGNORED' },
    });
  }
}
