export function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function createStepTiming(): { startedAt: string; startedAtMs: number } {
  return {
    startedAt: new Date().toISOString(),
    startedAtMs: Date.now(),
  };
}

export function completeStepTiming(timing: { startedAtMs: number }): { completedAt: string; durationMs: number } {
  return {
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - timing.startedAtMs,
  };
}
