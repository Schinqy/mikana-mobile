export type LeadUrgency = 'low' | 'medium' | 'urgent';

export type DealStage = 'captured' | 'quoted' | 'negotiating' | 'won' | 'lost';

export type LeadSource = 'whatsapp' | 'telegram' | 'manual' | 'classified';

export interface Lead {
  id: string;
  rawText: string;
  senderName: string;
  senderPhone: string;
  senderAvatarUrl?: string;
  channelName: string;
  category: string;
  urgency: LeadUrgency;
  budgetEstimate?: string;
  location?: string;
  matchScore: number; // 0 - 100
  stage: DealStage;
  aiSummary: string;
  extractedNeeds: string[];
  matchedServiceId?: string;
  generatedPitch?: string;
  quotedAmount?: number;
  currency: string;
  isAutopilotProcessed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LeadFilter = 'all' | 'hot' | 'urgent' | 'captured' | 'quoted' | 'won';
