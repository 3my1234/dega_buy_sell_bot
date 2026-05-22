import type { CanonExecutionLog } from './types';

declare const require: {
  (moduleName: 'fs'): {
    existsSync(path: string): boolean;
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    writeFileSync(path: string, data: string, encoding: 'utf8'): void;
  };
  (moduleName: 'path'): {
    join(...paths: string[]): string;
  };
};
declare const process: {
  cwd(): string;
};

export function writeCanonExecutionLog(log: CanonExecutionLog): string {
  const fs = require('fs');
  const path = require('path');
  const executionDir = path.join(process.cwd(), '.canon', 'execution');

  if (!fs.existsSync(executionDir)) {
    fs.mkdirSync(executionDir, { recursive: true });
  }

  const filePath = path.join(executionDir, `${log.runId}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(log, null, 2)}\n`, 'utf8');

  return filePath;
}
