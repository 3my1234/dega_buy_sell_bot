export function logInfo(event: string, message: string, metadata?: Record<string, unknown>): void {
  console.log(JSON.stringify({
    level: 'info',
    event,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  }));
}

export function logError(event: string, message: string, metadata?: Record<string, unknown>): void {
  console.error(JSON.stringify({
    level: 'error',
    event,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  }));
}
