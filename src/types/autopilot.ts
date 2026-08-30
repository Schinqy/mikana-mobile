export interface AutopilotConfig {
  isEnabled: boolean;
  minimumMatchScore: number; // 0 - 100
  dailyReplyLimit: number;
  repliesSentToday: number;
  autoQuoteAllowed: boolean;
  includePortfolioLinks: boolean;
  blacklistedKeywords: string[];
  whitelistChannels: string[];
  lastActiveTimestamp: string;
}

export type AutopilotLogStatus = 'dispatched' | 'skipped_score' | 'skipped_cap' | 'failed';

export interface AutopilotLog {
  id: string;
  leadId: string;
  leadSummary: string;
  senderContact: string;
  channel: string;
  dispatchedPitch: string;
  matchScore: number;
  status: AutopilotLogStatus;
  timestamp: string;
}
