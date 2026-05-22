import { STRATEGY_NAME } from './config';
import type { Sentiment, SentimentResult, SignalStrength, StrategyContext, TeamSymbol, TradeSide, TradeSignal } from './types';
import { clamp, round2 } from './utils';

export function generateTradeSignals(
  sentimentResults: SentimentResult[],
  context: StrategyContext,
): { generatedSignals: TradeSignal[]; acceptedSignals: TradeSignal[] } {
  const generatedSignals: TradeSignal[] = [];
  const byTeam = groupByTeam(sentimentResults);

  for (const [team, results] of byTeam.entries()) {
    const bearishWindow = latestConsecutive(results, 'BEARISH');
    const bullishWindow = latestConsecutive(results, 'BULLISH');

    if (bearishWindow.length >= context.minConsecutiveEvents) {
      generatedSignals.push(createSignal({
        context,
        team,
        side: 'SELL',
        results: bearishWindow,
        reason: `${team} printed ${bearishWindow.length} consecutive bearish momentum events`,
      }));

      generatedSignals.push(createSignal({
        context,
        team: getOpponent(team, context),
        side: 'BUY',
        results: bearishWindow,
        reason: `${team} weakness implies relative edge for ${getOpponent(team, context)}`,
      }));
    }

    if (bullishWindow.length >= context.minConsecutiveEvents) {
      generatedSignals.push(createSignal({
        context,
        team,
        side: 'BUY',
        results: bullishWindow,
        reason: `${team} printed ${bullishWindow.length} consecutive bullish momentum events`,
      }));
    }
  }

  return {
    generatedSignals,
    acceptedSignals: mergeSignals(generatedSignals)
      .filter((signal) => signal.confidence >= context.confidenceThreshold),
  };
}

function groupByTeam(results: SentimentResult[]): Map<TeamSymbol, SentimentResult[]> {
  const grouped = new Map<TeamSymbol, SentimentResult[]>();

  for (const result of results) {
    const teamResults = grouped.get(result.team) ?? [];
    teamResults.push(result);
    grouped.set(result.team, teamResults);
  }

  return grouped;
}

function latestConsecutive(results: SentimentResult[], sentiment: Sentiment): SentimentResult[] {
  const window: SentimentResult[] = [];

  for (let index = results.length - 1; index >= 0; index -= 1) {
    const result = results[index];

    if (result.sentiment !== sentiment) {
      break;
    }

    window.unshift(result);
  }

  return window;
}

function createSignal(input: {
  context: StrategyContext;
  team: TeamSymbol;
  side: TradeSide;
  results: SentimentResult[];
  reason: string;
}): TradeSignal {
  const absoluteScore = input.results.reduce((total, result) => total + Math.abs(result.score), 0);
  const confidence = clamp(round2(0.55 + absoluteScore / 20), 0.55, 0.95);
  const strength: SignalStrength = confidence >= 0.85 ? 'HIGH' : confidence >= 0.72 ? 'MEDIUM' : 'LOW';
  const size = Math.max(1, Math.round(input.context.maxOrderSize * confidence));

  return {
    signalId: `${STRATEGY_NAME}-${input.team}-${input.side}-${Date.now()}`,
    marketId: input.context.marketId,
    team: input.team,
    side: input.side,
    size,
    confidence,
    strength,
    reason: input.reason,
    sourceEventIds: input.results.map((result) => result.eventId),
    createdAt: new Date().toISOString(),
  };
}

function mergeSignals(signals: TradeSignal[]): TradeSignal[] {
  const merged = new Map<string, TradeSignal>();

  for (const signal of signals) {
    const key = `${signal.team}:${signal.side}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, signal);
      continue;
    }

    const confidence = Math.max(existing.confidence, signal.confidence);
    const strength: SignalStrength = confidence >= 0.85 ? 'HIGH' : confidence >= 0.72 ? 'MEDIUM' : 'LOW';

    merged.set(key, {
      ...existing,
      size: Math.max(existing.size, signal.size),
      confidence,
      strength,
      reason: `${existing.reason}; ${signal.reason}`,
      sourceEventIds: Array.from(new Set([...existing.sourceEventIds, ...signal.sourceEventIds])),
    });
  }

  return Array.from(merged.values());
}

function getOpponent(team: TeamSymbol, context: StrategyContext): TeamSymbol {
  return team === context.homeTeam ? context.awayTeam : context.homeTeam;
}
