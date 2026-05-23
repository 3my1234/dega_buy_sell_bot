import { executeStrategy } from './sentiment-squeeze.strategy';
import { logError } from './sentiment-squeeze/logger';
import type { CanonExecutionLog, StrategyContext } from './sentiment-squeeze/types';
import { errorToString } from './sentiment-squeeze/utils';

declare const require: { main?: unknown } | undefined;
declare const module: unknown;
declare const process: { exitCode?: number };

export async function run(context?: Partial<StrategyContext>): Promise<CanonExecutionLog> {
  return executeStrategy(context);
}

export async function handler(context?: Partial<StrategyContext>): Promise<CanonExecutionLog> {
  return run(context);
}

export default run;

if (typeof require !== 'undefined' && require.main === module) {
  run().catch((error) => {
    logError('CANON_ADAPTER_FAILED', 'Canon adapter run failed', { error: errorToString(error) });
    process.exitCode = 1;
  });
}
