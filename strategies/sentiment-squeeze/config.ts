import type { StrategyContext } from './types';

export const STRATEGY_NAME = 'sentiment-squeeze';

export const DEFAULT_CONTEXT: StrategyContext = {
  marketId: 'polygon-nba-playoffs-nyk-vs-bos-game-7',
  homeTeam: 'NYK',
  awayTeam: 'BOS',
  dryRun: true,
  minConsecutiveEvents: 2,
  maxOrderSize: 10,
  confidenceThreshold: 0.72,
};
