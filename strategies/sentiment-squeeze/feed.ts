import type { GameEvent } from './types';
import { delay } from './utils';

export async function fetchLiveGameFeed(): Promise<GameEvent[]> {
  await delay(150);

  return [
    {
      id: 'evt-001',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '07:24',
      team: 'NYK',
      text: 'NYK resets the offense after a routine defensive rebound.',
      source: 'mock-live-feed',
    },
    {
      id: 'evt-002',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '06:48',
      team: 'NYK',
      text: 'NYK star player picks up 4th foul defending the paint.',
      source: 'mock-live-feed',
    },
    {
      id: 'evt-003',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '06:11',
      team: 'NYK',
      text: 'NYK misses again as the offense falls into a scoring drought.',
      source: 'mock-live-feed',
    },
    {
      id: 'evt-004',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '05:42',
      team: 'BOS',
      text: 'BOS goes on a 12-0 run and takes the lead after a clutch three.',
      source: 'mock-live-feed',
    },
    {
      id: 'evt-005',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '04:58',
      team: 'BOS',
      text: 'BOS forces turnover into fast break points; crowd erupts.',
      source: 'mock-live-feed',
    },
    {
      id: 'evt-006',
      timestamp: new Date().toISOString(),
      quarter: 3,
      clock: '04:12',
      team: 'NYK',
      text: 'NYK calls timeout after another turnover near half court.',
      source: 'mock-live-feed',
    },
  ];
}
