import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { AIInsightCapability } from '@prisma/client';
import { AiBaseResponse } from './ai.types';

@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);
  
  // Circuit Breaker State
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly COOLDOWN_MS = 60000; // 60 seconds

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly circuitBreakerEnabled: boolean;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:8000');
    this.apiKey = this.configService.get('AI_SERVICE_API_KEY', '');
    this.timeoutMs = this.configService.get('AI_REQUEST_TIMEOUT_MS', 5000);
    this.circuitBreakerEnabled = this.configService.get('AI_CIRCUIT_BREAKER_ENABLED', 'true') === 'true';
  }

  /**
   * Internal mechanism to execute an HTTP request with Circuit Breaker and Timeout protection.
   */
  private async execute<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    payload: any,
    capability: AIInsightCapability,
  ): Promise<AiBaseResponse<T>> {
    const correlationId = crypto.randomUUID();

    // 1. Check Circuit Breaker
    if (this.circuitBreakerEnabled && this.isCircuitOpen()) {
      this.logger.warn(`[AI CLIENT] Circuit open. Skipping request for ${capability}`);
      return this.generateFallbackResponse(capability, 'AI service circuit breaker is open.');
    }

    try {
      this.logger.debug(`[AI CLIENT] Executing ${method} ${endpoint} (CorrID: ${correlationId})`);
      
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url: `${this.baseUrl}${endpoint}`,
          data: method === 'POST' ? payload : undefined,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'X-Correlation-ID': correlationId,
          },
          timeout: this.timeoutMs,
        }),
      );

      // Success: Reset circuit breaker
      this.recordSuccess();

      // Ensure response matches standard shape
      const data = response.data as AiBaseResponse<T>;
      return {
        ...data,
        correlationId: data.correlationId || correlationId,
      };

    } catch (error: any) {
      this.recordFailure();
      this.logger.error(`[AI CLIENT] Request failed: ${error.message} (CorrID: ${correlationId})`);
      return this.generateFallbackResponse(capability, `AI request failed: ${error.message}`);
    }
  }

  // --- External API Methods ---

  async classifyTicket(payload: any): Promise<AiBaseResponse<{ category: string }>> {
    return this.execute('POST', '/v1/tickets/classify', payload, 'TICKET_CLASSIFICATION');
  }

  async suggestPriority(payload: any): Promise<AiBaseResponse<{ priority: string }>> {
    return this.execute('POST', '/v1/tickets/priority', payload, 'PRIORITY_SUGGESTION');
  }

  async suggestRouting(payload: any): Promise<AiBaseResponse<{ assignedToId: string }>> {
    return this.execute('POST', '/v1/tickets/routing', payload, 'ROUTING_SUGGESTION');
  }

  async predictNoShow(payload: any): Promise<AiBaseResponse<{ probability: number }>> {
    return this.execute('POST', '/v1/bookings/no-show', payload, 'NO_SHOW_PREDICTION');
  }

  async detectRepeatIssue(payload: any): Promise<AiBaseResponse<{ isRepeat: boolean }>> {
    return this.execute('POST', '/v1/rooms/repeat-issue', payload, 'REPEAT_ISSUE_DETECTION');
  }

  async generateWorkforceInsight(payload: any): Promise<AiBaseResponse<any>> {
    return this.execute('POST', '/v1/workforce/insight', payload, 'WORKFORCE_INSIGHT');
  }

  // --- Circuit Breaker Logic ---

  private isCircuitOpen(): boolean {
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.COOLDOWN_MS) {
        // Half-open: allow one test request
        this.logger.log(`[AI CLIENT] Circuit half-open. Allowing test request.`);
        return false; 
      }
      return true; // Still open
    }
    return false; // Closed
  }

  private recordSuccess(): void {
    if (this.failureCount > 0) {
      this.logger.log(`[AI CLIENT] Request succeeded. Resetting circuit breaker.`);
      this.failureCount = 0;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount === this.FAILURE_THRESHOLD) {
      this.logger.error(`[AI CLIENT] Circuit Breaker OPENED! AI service is unreachable.`);
    }
  }

  // --- Fallback Generator ---

  private generateFallbackResponse<T>(capability: AIInsightCapability, reason: string): AiBaseResponse<T> {
    return {
      success: false,
      capability,
      confidence: 0,
      recommendation: null,
      explanation: `Fallback applied: ${reason}`,
      modelVersion: 'fallback-v0',
      timestamp: new Date().toISOString(),
    };
  }
}
