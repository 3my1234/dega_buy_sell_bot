import type { Sentiment, SentimentResult } from './types';

const bullishKeywords = new Map<string, number>([
  ['12-0 run', 4],
  ['back-to-back three', 4],
  ['60-second blitz', 4],
  ['goes on a run', 3],
  ['heating up', 2],
  ['dominates', 3],
  ['clutch three', 3],
  ['star player returns', 3],
  ['defensive stop', 2],
  ['forces turnover', 2],
  ['fast break', 2],
  ['takes the lead', 4],
  ['extends the lead', 3],
  ['crowd erupts', 2],
  ['momentum swing', 3],
]);

const bearishKeywords = new Map<string, number>([
  ['4th foul', 4],
  ['5th foul', 5],
  ['exits to the locker room', 6],
  ['injury scare', 5],
  ['limps', 5],
  ['commits turnover', 2],
  ['another turnover', 2],
  ['turnover near half court', 2],
  ['cold streak', 3],
  ['misses again', 3],
  ['timeout after', 2],
  ['loses the lead', 4],
  ['frustration foul', 3],
  ['technical foul', 4],
  ['scoring drought', 4],
]);

export function analyzeSentiment(text: string): Sentiment {
  return analyzeText(text).sentiment;
}

export function analyzeText(text: string): Pick<SentimentResult, 'sentiment' | 'score' | 'matchedKeywords'> {
  const normalizedText = text.toLowerCase();
  const matchedKeywords: string[] = [];
  let score = 0;

  for (const [keyword, weight] of bullishKeywords.entries()) {
    if (normalizedText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += weight;
    }
  }

  for (const [keyword, weight] of bearishKeywords.entries()) {
    if (normalizedText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score -= weight;
    }
  }

  if (score >= 3) {
    return { sentiment: 'BULLISH', score, matchedKeywords };
  }

  if (score <= -3) {
    return { sentiment: 'BEARISH', score, matchedKeywords };
  }

  return { sentiment: 'NEUTRAL', score, matchedKeywords };
}
