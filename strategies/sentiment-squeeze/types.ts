export type Sentiment = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type TradeSide = 'BUY' | 'SELL';
export type SignalStrength = 'LOW' | 'MEDIUM' | 'HIGH';
export type TeamSymbol = 'NYK' | 'BOS';

export interface StrategyContext {
  marketId: string;
  homeTeam: TeamSymbol;
  awayTeam: TeamSymbol;
  dryRun: boolean;
  minConsecutiveEvents: number;
  maxOrderSize: number;
  confidenceThreshold: number;
}

export interface GameEvent {
  id: string;
  timestamp: string;
  quarter: number;
  clock: string;
  team: TeamSymbol;
  text: string;
  source: 'mock-live-feed';
}

export interface SentimentResult {
  eventId: string;
  team: TeamSymbol;
  sentiment: Sentiment;
  score: number;
  matchedKeywords: string[];
  text: string;
}

export interface TradeSignal {
  signalId: string;
  marketId: string;
  team: TeamSymbol;
  side: TradeSide;
  size: number;
  confidence: number;
  strength: SignalStrength;
  reason: string;
  sourceEventIds: string[];
  createdAt: string;
}

export interface CanonOrderPayload {
  marketId: string;
  outcome: TeamSymbol;
  side: TradeSide;
  size: number;
  orderType: 'MARKET';
  metadata: {
    strategy: string;
    signalId: string;
    confidence: number;
    reason: string;
    dryRun: boolean;
  };
}

export interface PipelineEntry {
  step: 'DATA_FETCH' | 'ANALYZE' | 'DECIDE' | 'EXECUTE';
  status: 'OK' | 'SKIPPED' | 'ERROR';
  message: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface CanonExecutionLog {
  strategy: string;
  runId: string;
  marketId: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  pipeline: PipelineEntry[];
  signals: TradeSignal[];
  orders: CanonOrderPayload[];
  error?: string;
}
