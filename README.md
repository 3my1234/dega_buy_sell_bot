# Sentiment Squeeze Bot

Sentiment Squeeze is a DEGA Canon-ready TypeScript strategy for NBA prediction markets on Polygon. It simulates a live sports text feed, scores short-form game commentary for momentum shifts, and converts consecutive directional sentiment into dry-run market orders.

## Strategy Thesis

Live prediction markets can lag fast off-chain information. A foul, scoring drought, injury scare, or rapid scoring run can shift implied win probability before the order book fully reprices. This strategy watches a simulated real-time commentary stream and looks for consecutive events that point in the same direction.

When the feed shows repeated bearish events for one team, the bot prepares a sell signal for that team and a buy signal for the opponent. When the feed shows repeated bullish events for a team, the bot prepares a buy signal for that team.

## Pipeline

The Canon-facing entrypoint is:

```ts
executeStrategy()
```

The Canon adapter entrypoint is:

```ts
strategies/canon.ts
```

It exports `run`, `handler`, and a default function that call the same strategy loop. The included `canon.config.json` documents the intended Canon-style entrypoint and `.canon/execution` log directory. This keeps the strategy easy to drop into a `canon init` project even though this local machine does not currently have the Canon CLI installed.

The strategy loop is intentionally simple:

1. Data Fetch: load mock live game commentary from `fetchLiveGameFeed()`.
2. Analyze: parse each text update into `BULLISH`, `BEARISH`, or `NEUTRAL`.
3. Decide: detect consecutive team-specific sentiment shifts and generate trade signals.
4. Execute: convert accepted signals into Canon-style order payloads and dry-run submit them.

## How to Test Locally

From the project root:

```powershell
npm run check
npm run build
npm run start
```

What each command proves:

- `npm run check` verifies the full TypeScript strategy under strict type checking without writing build output.
- `npm run build` compiles the strategy into `dist/`.
- `npm run start` runs `node dist/strategies/sentiment-squeeze.strategy.js`.

When the strategy runs, it prints structured JSON logs to the terminal and writes the final run-level Canon envelope into:

```text
.canon/execution/
```

To run the Canon adapter directly:

```powershell
npm run build
npm run canon:start
```

To run the local live dashboard:

```powershell
npm run build
npm run demo
```

Then open:

```text
http://localhost:4173
```

To inspect the latest saved execution log in PowerShell:

```powershell
Get-ChildItem .canon\execution | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

## Project Structure

```text
strategies/
  canon.ts                            Canon-style adapter entrypoint
  sentiment-squeeze.strategy.ts       Canon-facing orchestration entrypoint
  sentiment-squeeze/
    config.ts                         Strategy constants and defaults
    canon-log-writer.ts               Writes final run logs to .canon/execution/
    decision.ts                       Consecutive sentiment signal logic
    execution.ts                      Signal-to-order adapter and submit mock
    feed.ts                           Mock live NBA commentary feed
    logger.ts                         Structured JSON logging
    sentiment.ts                      Keyword-weighted sentiment parser
    types.ts                          Shared strategy and Canon log types
    utils.ts                          Timing, math, and error helpers
demo/
  live-dashboard.ts                   Local browser dashboard for demo runs
```

## Canon Log Shape

The strategy returns a run-level `CanonExecutionLog`. The `pipeline` array records timing for every phase, while `signals` and `orders` keep the micro-level trade details inside the same envelope.

```json
{
  "strategy": "sentiment-squeeze",
  "runId": "sentiment-squeeze-1779999999999",
  "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
  "status": "COMPLETED",
  "pipeline": [
    {
      "step": "DATA_FETCH",
      "status": "OK",
      "message": "Fetched 6 live game events",
      "startedAt": "2026-05-22T18:20:00.000Z",
      "completedAt": "2026-05-22T18:20:00.150Z",
      "durationMs": 150,
      "metadata": {
        "eventIds": ["evt-001", "evt-002", "evt-003", "evt-004", "evt-005", "evt-006"]
      }
    }
  ],
  "signals": [
    {
      "team": "NYK",
      "side": "SELL",
      "size": 10,
      "confidence": 0.95,
      "strength": "HIGH",
      "reason": "NYK printed 3 consecutive bearish momentum events"
    }
  ],
  "orders": [
    {
      "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
      "outcome": "NYK",
      "side": "SELL",
      "size": 10,
      "orderType": "MARKET"
    }
  ]
}
```

## Live Sample Execution Log

Generated with:

```powershell
npm run build
npm run start
```

```json
{
  "strategy": "sentiment-squeeze",
  "runId": "sentiment-squeeze-1779476347157",
  "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
  "startedAt": "2026-05-22T18:59:07.157Z",
  "status": "COMPLETED",
  "pipeline": [
    {
      "step": "DATA_FETCH",
      "status": "OK",
      "message": "Fetched 6 live game events",
      "startedAt": "2026-05-22T18:59:07.168Z",
      "completedAt": "2026-05-22T18:59:07.331Z",
      "durationMs": 163,
      "metadata": {
        "eventIds": [
          "evt-001",
          "evt-002",
          "evt-003",
          "evt-004",
          "evt-005",
          "evt-006"
        ]
      }
    },
    {
      "step": "ANALYZE",
      "status": "OK",
      "message": "Analyzed 6 events",
      "startedAt": "2026-05-22T18:59:07.331Z",
      "completedAt": "2026-05-22T18:59:07.332Z",
      "durationMs": 1,
      "metadata": {
        "bullish": 2,
        "bearish": 3,
        "neutral": 1
      }
    },
    {
      "step": "DECIDE",
      "status": "OK",
      "message": "Generated 2 trade signals",
      "startedAt": "2026-05-22T18:59:07.334Z",
      "completedAt": "2026-05-22T18:59:07.334Z",
      "durationMs": 0,
      "metadata": {
        "generated": 3,
        "accepted": 2,
        "confidenceThreshold": 0.72
      }
    },
    {
      "step": "EXECUTE",
      "status": "OK",
      "message": "Prepared 2 dry-run order payloads",
      "startedAt": "2026-05-22T18:59:07.335Z",
      "completedAt": "2026-05-22T18:59:07.455Z",
      "durationMs": 120,
      "metadata": {
        "orderCount": 2,
        "dryRun": true
      }
    }
  ],
  "signals": [
    {
      "signalId": "sentiment-squeeze-NYK-SELL-1779476347334",
      "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
      "team": "NYK",
      "side": "SELL",
      "size": 10,
      "confidence": 0.95,
      "strength": "HIGH",
      "reason": "NYK printed 3 consecutive bearish momentum events",
      "sourceEventIds": [
        "evt-002",
        "evt-003",
        "evt-006"
      ],
      "createdAt": "2026-05-22T18:59:07.334Z"
    },
    {
      "signalId": "sentiment-squeeze-BOS-BUY-1779476347334",
      "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
      "team": "BOS",
      "side": "BUY",
      "size": 10,
      "confidence": 0.95,
      "strength": "HIGH",
      "reason": "NYK weakness implies relative edge for BOS; BOS printed 2 consecutive bullish momentum events",
      "sourceEventIds": [
        "evt-002",
        "evt-003",
        "evt-006",
        "evt-004",
        "evt-005"
      ],
      "createdAt": "2026-05-22T18:59:07.334Z"
    }
  ],
  "orders": [
    {
      "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
      "outcome": "NYK",
      "side": "SELL",
      "size": 10,
      "orderType": "MARKET",
      "metadata": {
        "strategy": "sentiment-squeeze",
        "signalId": "sentiment-squeeze-NYK-SELL-1779476347334",
        "confidence": 0.95,
        "reason": "NYK printed 3 consecutive bearish momentum events",
        "dryRun": true
      }
    },
    {
      "marketId": "polygon-nba-playoffs-nyk-vs-bos-game-7",
      "outcome": "BOS",
      "side": "BUY",
      "size": 10,
      "orderType": "MARKET",
      "metadata": {
        "strategy": "sentiment-squeeze",
        "signalId": "sentiment-squeeze-BOS-BUY-1779476347334",
        "confidence": 0.95,
        "reason": "NYK weakness implies relative edge for BOS; BOS printed 2 consecutive bullish momentum events",
        "dryRun": true
      }
    }
  ],
  "completedAt": "2026-05-22T18:59:07.455Z"
}
```

## Validation

Strict TypeScript validation:

```powershell
tsc strategies\sentiment-squeeze.strategy.ts --noEmit --target ES2020 --module commonjs --strict
```

The current implementation has no external dependencies and runs in dry-run mode by default.
