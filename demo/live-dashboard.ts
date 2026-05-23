import { executeStrategy } from '../strategies/sentiment-squeeze.strategy';
import type { CanonExecutionLog } from '../strategies/sentiment-squeeze/types';

declare const require: {
  (moduleName: 'fs'): {
    existsSync(path: string): boolean;
    mkdirSync(path: string, options?: { recursive?: boolean }): void;
    readdirSync(path: string): string[];
    statSync(path: string): { mtimeMs: number };
    readFileSync(path: string, encoding: 'utf8'): string;
  };
  (moduleName: 'http'): {
    createServer(handler: (request: HttpRequest, response: HttpResponse) => void | Promise<void>): {
      listen(port: number, callback: () => void): void;
    };
  };
  (moduleName: 'path'): {
    join(...paths: string[]): string;
  };
};

declare const process: {
  cwd(): string;
  env: { PORT?: string };
};

interface HttpRequest {
  method?: string;
  url?: string;
}

interface HttpResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.PORT ?? 4173);
const executionDir = path.join(process.cwd(), '.canon', 'execution');

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === 'GET' && request.url === '/') {
      sendHtml(response, dashboardHtml);
      return;
    }

    if (request.method === 'GET' && request.url === '/api/latest') {
      sendJson(response, readLatestExecutionLog());
      return;
    }

    if (request.method === 'POST' && request.url === '/api/run') {
      const log = await executeStrategy();
      sendJson(response, log);
      return;
    }

    response.statusCode = 404;
    response.end('Not found');
  } catch (error) {
    response.statusCode = 500;
    sendJson(response, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, () => {
  console.log(`Sentiment Squeeze dashboard running at http://localhost:${port}`);
});

function readLatestExecutionLog(): CanonExecutionLog | null {
  if (!fs.existsSync(executionDir)) {
    fs.mkdirSync(executionDir, { recursive: true });
    return null;
  }

  const files = fs.readdirSync(executionDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => ({
      fileName,
      filePath: path.join(executionDir, fileName),
    }))
    .sort((left, right) => fs.statSync(right.filePath).mtimeMs - fs.statSync(left.filePath).mtimeMs);

  if (files.length === 0) {
    return null;
  }

  return JSON.parse(fs.readFileSync(files[0].filePath, 'utf8')) as CanonExecutionLog;
}

function sendJson(response: HttpResponse, body: unknown): void {
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body, null, 2));
}

function sendHtml(response: HttpResponse, body: string): void {
  response.setHeader('content-type', 'text/html; charset=utf-8');
  response.end(body);
}

const dashboardHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sentiment Squeeze Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #151515;
      background: #f5f7f3;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
    }

    main {
      width: min(1180px, calc(100vw - 32px));
      margin: 0 auto;
      padding: 28px 0 40px;
    }

    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 18px;
      border-bottom: 1px solid #d8ddd1;
      padding-bottom: 18px;
    }

    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.1;
      font-weight: 760;
    }

    .subtitle {
      margin: 8px 0 0;
      color: #586052;
      font-size: 14px;
    }

    button {
      appearance: none;
      border: 1px solid #20251c;
      background: #20251c;
      color: #fff;
      min-height: 40px;
      padding: 0 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      cursor: wait;
      opacity: 0.66;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .panel {
      border: 1px solid #d8ddd1;
      border-radius: 8px;
      background: #fff;
      padding: 14px;
    }

    .label {
      color: #687060;
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 800;
    }

    .value {
      margin-top: 8px;
      font-size: 24px;
      font-weight: 780;
    }

    .section {
      margin-top: 18px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    th,
    td {
      text-align: left;
      border-bottom: 1px solid #ecefe8;
      padding: 10px 8px;
      vertical-align: top;
    }

    th {
      color: #596153;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 9px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      background: #edf2e5;
      color: #26351d;
    }

    .buy {
      background: #e6f4ee;
      color: #0c5132;
    }

    .sell {
      background: #f9e6e2;
      color: #8b2518;
    }

    pre {
      margin: 0;
      max-height: 360px;
      overflow: auto;
      background: #10140f;
      color: #e8f0df;
      padding: 14px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.45;
    }

    @media (max-width: 760px) {
      header {
        align-items: stretch;
        flex-direction: column;
      }

      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Sentiment Squeeze</h1>
        <p class="subtitle">NBA prediction market automation dashboard</p>
      </div>
      <button id="runButton" type="button">Run Strategy</button>
    </header>

    <section class="grid" aria-label="Run summary">
      <div class="panel">
        <div class="label">Status</div>
        <div class="value" id="status">-</div>
      </div>
      <div class="panel">
        <div class="label">Signals</div>
        <div class="value" id="signals">-</div>
      </div>
      <div class="panel">
        <div class="label">Orders</div>
        <div class="value" id="orders">-</div>
      </div>
      <div class="panel">
        <div class="label">Runtime</div>
        <div class="value" id="runtime">-</div>
      </div>
    </section>

    <section class="panel section">
      <div class="label">Pipeline</div>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody id="pipeline"></tbody>
      </table>
    </section>

    <section class="panel section">
      <div class="label">Orders</div>
      <table>
        <thead>
          <tr>
            <th>Outcome</th>
            <th>Side</th>
            <th>Size</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody id="orderRows"></tbody>
      </table>
    </section>

    <section class="section">
      <pre id="raw">{}</pre>
    </section>
  </main>

  <script>
    const runButton = document.getElementById('runButton');
    const statusEl = document.getElementById('status');
    const signalsEl = document.getElementById('signals');
    const ordersEl = document.getElementById('orders');
    const runtimeEl = document.getElementById('runtime');
    const pipelineEl = document.getElementById('pipeline');
    const orderRowsEl = document.getElementById('orderRows');
    const rawEl = document.getElementById('raw');

    runButton.addEventListener('click', async () => {
      runButton.disabled = true;
      runButton.textContent = 'Running...';

      try {
        const response = await fetch('/api/run', { method: 'POST' });
        render(await response.json());
      } finally {
        runButton.disabled = false;
        runButton.textContent = 'Run Strategy';
      }
    });

    async function loadLatest() {
      const response = await fetch('/api/latest');
      render(await response.json());
    }

    function render(log) {
      if (!log) {
        rawEl.textContent = 'No execution log yet. Run the strategy.';
        return;
      }

      statusEl.textContent = log.status;
      signalsEl.textContent = String(log.signals?.length ?? 0);
      ordersEl.textContent = String(log.orders?.length ?? 0);
      runtimeEl.textContent = totalRuntime(log) + 'ms';
      rawEl.textContent = JSON.stringify(log, null, 2);

      pipelineEl.innerHTML = (log.pipeline ?? []).map((step) => '<tr>' +
        '<td>' + escapeHtml(step.step) + '</td>' +
        '<td><span class="badge">' + escapeHtml(step.status) + '</span></td>' +
        '<td>' + escapeHtml(String(step.durationMs)) + 'ms</td>' +
        '<td>' + escapeHtml(step.message) + '</td>' +
      '</tr>').join('');

      orderRowsEl.innerHTML = (log.orders ?? []).map((order) => '<tr>' +
        '<td>' + escapeHtml(order.outcome) + '</td>' +
        '<td><span class="badge ' + order.side.toLowerCase() + '">' + escapeHtml(order.side) + '</span></td>' +
        '<td>' + escapeHtml(String(order.size)) + '</td>' +
        '<td>' + escapeHtml(order.metadata?.reason ?? '') + '</td>' +
      '</tr>').join('');
    }

    function totalRuntime(log) {
      return (log.pipeline ?? []).reduce((total, step) => total + (step.durationMs ?? 0), 0);
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    loadLatest();
  </script>
</body>
</html>`;
