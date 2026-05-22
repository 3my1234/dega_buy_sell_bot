import { STRATEGY_NAME } from './config';
import { logInfo } from './logger';
import type { CanonOrderPayload, StrategyContext, TradeSignal } from './types';
import { delay } from './utils';

export async function executeTradeSignals(
  signals: TradeSignal[],
  context: StrategyContext,
): Promise<CanonOrderPayload[]> {
  const orders = signals.map((signal) => toCanonOrderPayload(signal, context));

  for (const order of orders) {
    await submitOrder(order);
  }

  return orders;
}

export function toCanonOrderPayload(signal: TradeSignal, context: StrategyContext): CanonOrderPayload {
  return {
    marketId: signal.marketId,
    outcome: signal.team,
    side: signal.side,
    size: signal.size,
    orderType: 'MARKET',
    metadata: {
      strategy: STRATEGY_NAME,
      signalId: signal.signalId,
      confidence: signal.confidence,
      reason: signal.reason,
      dryRun: context.dryRun,
    },
  };
}

export async function submitOrder(order: CanonOrderPayload): Promise<void> {
  await delay(50);

  logInfo('ORDER_PAYLOAD', `${order.metadata.dryRun ? 'Prepared' : 'Submitted'} ${order.side} order`, {
    marketId: order.marketId,
    outcome: order.outcome,
    side: order.side,
    size: order.size,
    confidence: order.metadata.confidence,
    dryRun: order.metadata.dryRun,
  });
}
