import { AIInsightCapability } from '@prisma/client';

export interface AiBaseResponse<T = any> {
  success: boolean;
  capability: AIInsightCapability;
  confidence: number;
  recommendation: T | null;
  explanation: string;
  modelVersion: string;
  correlationId?: string;
  timestamp?: string;
}

export interface ClassifyTicketRecommendation {
  category: string;
}

export interface SuggestPriorityRecommendation {
  priority: string;
}

export interface SuggestRoutingRecommendation {
  assignedToId: string;
}

export interface PredictNoShowRecommendation {
  probability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
