import { DEFAULT_CONTEXT, STRATEGY_NAME } from './sentiment-squeeze/config';
import { writeCanonExecutionLog } from './sentiment-squeeze/canon-log-writer';
import { generateTradeSignals } from './sentiment-squeeze/decision';
import { executeTradeSignals } from './sentiment-squeeze/execution';
import { fetchLiveGameFeed } from './sentiment-squeeze/feed';
import { logError, logInfo } from './sentiment-squeeze/logger';
import { analyzeSentiment, analyzeText } from './sentiment-squeeze/sentiment';
import type { CanonExecutionLog, CanonOrderPayload, GameEvent, SentimentResult, StrategyContext, TradeSignal } from './sentiment-squeeze/types';
import { completeStepTiming, createStepTiming, errorToString } from './sentiment-squeeze/utils';

declare const require: { main?: unknown } | undefined;
declare const module: unknown;
declare const process: { exitCode?: number };

export { fetchLiveGameFeed, analyzeSentiment };
export type { CanonExecutionLog, CanonOrderPayload, GameEvent, SentimentResult, StrategyContext, TradeSignal };

export async function executeStrategy(
  overrides: Partial<StrategyContext> = {},
): Promise<CanonExecutionLog> {
  const context: StrategyContext = { ...DEFAULT_CONTEXT, ...overrides };
  const runId = `${STRATEGY_NAME}-${Date.now()}`;
  const executionLog: CanonExecutionLog = {
    strategy: STRATEGY_NAME,
    runId,
    marketId: context.marketId,
    startedAt: new Date().toISOString(),
    status: 'RUNNING',
    pipeline: [],
    signals: [],
    orders: [],
  };

  logInfo('RUN_START', 'Starting Sentiment Squeeze strategy', {
    runId,
    marketId: context.marketId,
    dryRun: context.dryRun,
  });

  try {
    const events = await runDataFetchStep(executionLog);
    const sentimentResults = runAnalyzeStep(executionLog, events);
    const signals = runDecideStep(executionLog, sentimentResults, context);
    const orders = await runExecuteStep(executionLog, signals, context);

    executionLog.signals = signals;
    executionLog.orders = orders;
    executionLog.status = 'COMPLETED';
    executionLog.completedAt = new Date().toISOString();
    const executionLogPath = writeCanonExecutionLog(executionLog);

    logInfo('RUN_COMPLETE', 'Strategy run completed', {
      runId,
      signals: signals.length,
      orders: orders.length,
      executionLogPath,
    });

    console.log(JSON.stringify(executionLog, null, 2));
    return executionLog;
  } catch (error) {
    const message = errorToString(error);
    executionLog.status = 'FAILED';
    executionLog.completedAt = new Date().toISOString();
    executionLog.error = message;
    const executionLogPath = writeCanonExecutionLog(executionLog);

    logError('RUN_FAILED', 'Strategy run failed', { runId, error: message, executionLogPath });
    console.log(JSON.stringify(executionLog, null, 2));
    return executionLog;
  }
}

async function runDataFetchStep(log: CanonExecutionLog): Promise<GameEvent[]> {
  const timing = createStepTiming();

  try {
    logInfo('DATA_FETCH', 'Fetching mock live game feed');
    const events = await fetchLiveGameFeed();

    log.pipeline.push({
      step: 'DATA_FETCH',
      status: 'OK',
      message: `Fetched ${events.length} live game events`,
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { eventIds: events.map((event) => event.id) },
    });

    logInfo('DATA_FETCH_OK', 'Live feed received', { count: events.length });
    return events;
  } catch (error) {
    log.pipeline.push({
      step: 'DATA_FETCH',
      status: 'ERROR',
      message: 'Failed to fetch live game feed',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { error: errorToString(error) },
    });
    throw error;
  }
}

function runAnalyzeStep(log: CanonExecutionLog, events: GameEvent[]): SentimentResult[] {
  const timing = createStepTiming();

  try {
    logInfo('ANALYZE', 'Analyzing sports sentiment triggers');

    const results = events.map((event) => {
      const parsed = analyzeText(event.text);

      return {
        eventId: event.id,
        team: event.team,
        sentiment: parsed.sentiment,
        score: parsed.score,
        matchedKeywords: parsed.matchedKeywords,
        text: event.text,
      };
    });

    log.pipeline.push({
      step: 'ANALYZE',
      status: 'OK',
      message: `Analyzed ${results.length} events`,
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: {
        bullish: results.filter((result) => result.sentiment === 'BULLISH').length,
        bearish: results.filter((result) => result.sentiment === 'BEARISH').length,
        neutral: results.filter((result) => result.sentiment === 'NEUTRAL').length,
      },
    });

    for (const result of results) {
      logInfo('SENTIMENT_RESULT', `${result.team} ${result.sentiment}`, {
        eventId: result.eventId,
        score: result.score,
        matchedKeywords: result.matchedKeywords,
      });
    }

    return results;
  } catch (error) {
    log.pipeline.push({
      step: 'ANALYZE',
      status: 'ERROR',
      message: 'Failed during sentiment analysis',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { error: errorToString(error) },
    });
    throw error;
  }
}

function runDecideStep(
  log: CanonExecutionLog,
  sentimentResults: SentimentResult[],
  context: StrategyContext,
): TradeSignal[] {
  const timing = createStepTiming();

  try {
    logInfo('DECIDE', 'Scanning for consecutive directional shifts');
    const { generatedSignals, acceptedSignals } = generateTradeSignals(sentimentResults, context);

    log.pipeline.push({
      step: 'DECIDE',
      status: acceptedSignals.length > 0 ? 'OK' : 'SKIPPED',
      message:
        acceptedSignals.length > 0
          ? `Generated ${acceptedSignals.length} trade signals`
          : 'No trade signals passed confidence threshold',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: {
        generated: generatedSignals.length,
        accepted: acceptedSignals.length,
        confidenceThreshold: context.confidenceThreshold,
      },
    });

    for (const signal of acceptedSignals) {
      logInfo('TRADE_SIGNAL', `${signal.side} ${signal.team}`, {
        signalId: signal.signalId,
        confidence: signal.confidence,
        strength: signal.strength,
        reason: signal.reason,
      });
    }

    return acceptedSignals;
  } catch (error) {
    log.pipeline.push({
      step: 'DECIDE',
      status: 'ERROR',
      message: 'Failed while generating trade signals',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { error: errorToString(error) },
    });
    throw error;
  }
}

async function runExecuteStep(
  log: CanonExecutionLog,
  signals: TradeSignal[],
  context: StrategyContext,
): Promise<CanonOrderPayload[]> {
  const timing = createStepTiming();

  if (signals.length === 0) {
    log.pipeline.push({
      step: 'EXECUTE',
      status: 'SKIPPED',
      message: 'No signals to execute',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
    });
    logInfo('EXECUTE_SKIPPED', 'No executable trade signals');
    return [];
  }

  try {
    logInfo('EXECUTE', 'Building Canon order payloads', { dryRun: context.dryRun });
    const orders = await executeTradeSignals(signals, context);

    log.pipeline.push({
      step: 'EXECUTE',
      status: 'OK',
      message: context.dryRun
        ? `Prepared ${orders.length} dry-run order payloads`
        : `Submitted ${orders.length} order payloads`,
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { orderCount: orders.length, dryRun: context.dryRun },
    });

    return orders;
  } catch (error) {
    log.pipeline.push({
      step: 'EXECUTE',
      status: 'ERROR',
      message: 'Failed while executing trade payloads',
      startedAt: timing.startedAt,
      ...completeStepTiming(timing),
      metadata: { error: errorToString(error) },
    });
    throw error;
  }
}

if (typeof require !== 'undefined' && require.main === module) {
  executeStrategy().catch((error) => {
    logError('UNHANDLED_REJECTION', 'Unhandled strategy error', { error: errorToString(error) });
    process.exitCode = 1;
  });
}
