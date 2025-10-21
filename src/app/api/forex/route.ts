export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { unstable_noStore } from 'next/cache';
import axios from 'axios';
import { callA0LLM } from '../../../lib/a0llm';

interface Signal {
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  confidence: number;
  takeProfit: number;
  stopLoss: number;
}

// Helper function to calculate SMA
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

// Helper function to calculate EMA
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  ema.push(prices[0]);
  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
  }
  return ema;
}

// Helper function to calculate RSI
function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }
  return rsi;
}

// Helper function to calculate MACD
function calculateMACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd: number[] = [];
  for (let i = 25; i < prices.length; i++) {
    macd.push(ema12[i] - ema26[i - 14]);
  }
  const signal = calculateEMA(macd, 9);
  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    histogram.push(macd[i] - signal[i]);
  }
  return { macd, signal, histogram };
}

// Helper function to calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number[]; middle: number[]; lower: number[] } {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { upper, middle: sma, lower };
}

// Helper function to calculate Stochastic Oscillator
function calculateStochastic(prices: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number[]; d: number[] } {
  const k: number[] = [];
  for (let i = kPeriod - 1; i < prices.length; i++) {
    const slice = prices.slice(i - kPeriod + 1, i + 1);
    const highest = Math.max(...slice);
    const lowest = Math.min(...slice);
    k.push(((prices[i] - lowest) / (highest - lowest)) * 100);
  }
  const d = calculateSMA(k, dPeriod);
  return { k, d };
}

// Advanced AI-driven signal generation using LLM analysis
async function generateSignalForPair(prices: number[]): Promise<{ type: 'BUY' | 'SELL' | 'HOLD'; confidence: number }> {
  // Calculate indicators
  const rsiValues = calculateRSI(prices);
  const rsi = rsiValues[rsiValues.length - 1];

  const sma5 = calculateSMA(prices, 5);
  const sma10 = calculateSMA(prices, 10);
  const smaCrossover = sma5[sma5.length - 1] > sma10[sma10.length - 1] ? 'bullish' : 'bearish';

  const ema5 = calculateEMA(prices, 5);
  const ema10 = calculateEMA(prices, 10);
  const emaCrossover = ema5[ema5.length - 1] > ema10[ema10.length - 1] ? 'bullish' : 'bearish';

  const { macd, signal: macdSignal, histogram } = calculateMACD(prices);
  const macdStatus = histogram[histogram.length - 1] > 0 ? 'bullish' : 'bearish';

  const { upper, middle, lower } = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  const bbPosition = currentPrice > upper[upper.length - 1] ? 'above upper' : currentPrice < lower[lower.length - 1] ? 'below lower' : 'within bands';

  const { k, d } = calculateStochastic(prices);
  const kVal = k[k.length - 1];
  const dVal = d[d.length - 1];
  const stochStatus = kVal < 20 && dVal < 20 ? 'oversold' : kVal > 80 && dVal > 80 ? 'overbought' : 'neutral';

  // Create prompt for LLM
  const prompt = `You are a professional forex trader and technical analyst. Based on the following technical indicators for a currency pair, provide a trading signal and confidence level.

Indicators:
- RSI: ${rsi.toFixed(2)} (${rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'})
- SMA 5/10 Crossover: ${smaCrossover}
- EMA 5/10 Crossover: ${emaCrossover}
- MACD: ${macdStatus}
- Bollinger Bands: Price is ${bbPosition}
- Stochastic: ${stochStatus} (${kVal.toFixed(2)}/${dVal.toFixed(2)})

Based on these indicators, what is your trading signal? Respond with ONLY: SIGNAL: BUY/SELL/HOLD, CONFIDENCE: X (where X is a number from 0 to 100 representing your confidence in the signal).`;

  try {
    const messages = [
      { role: 'system' as const, content: 'You are an expert forex trader providing precise trading signals based on technical analysis.' },
      { role: 'user' as const, content: prompt }
    ];

    const response = await callA0LLM(messages, {
      temperature: 0.1,
      schema: {
        type: 'object',
        properties: {
          signal: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
          confidence: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['signal', 'confidence']
      }
    }); // Low temperature for consistent analysis

    // Parse response
    let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;

    if (response.schema_data && response.schema_data.signal && response.schema_data.confidence !== undefined) {
      type = response.schema_data.signal;
      confidence = response.schema_data.confidence;
    } else {
      // Fallback to parsing completion
      const signalMatch = response.completion.match(/SIGNAL:\s*(BUY|SELL|HOLD)/i);
      const confidenceMatch = response.completion.match(/CONFIDENCE:\s*(\d+)/i);

      if (signalMatch) {
        type = signalMatch[1].toUpperCase() as 'BUY' | 'SELL' | 'HOLD';
      }
      if (confidenceMatch) {
        confidence = parseInt(confidenceMatch[1]);
      }
    }

    return { type, confidence: Math.max(0, Math.min(100, confidence)) };
  } catch (error) {
    console.error('LLM call failed, falling back to rule-based:', error);
    // Fallback to rule-based scoring
    let score = 0;
    if (rsi < 30) score += 2;
    else if (rsi > 70) score -= 2;
    if (smaCrossover === 'bullish') score += 1.5;
    else score -= 1.5;
    if (emaCrossover === 'bullish') score += 1;
    else score -= 1;
    if (macdStatus === 'bullish') score += 1.5;
    else score -= 1.5;
    if (bbPosition === 'below lower') score += 2;
    else if (bbPosition === 'above upper') score -= 2;
    if (stochStatus === 'oversold') score += 1.5;
    else if (stochStatus === 'overbought') score -= 1.5;

    if (score >= 4) return { type: 'BUY', confidence: Math.min(95, 70 + score * 5) };
    else if (score <= -4) return { type: 'SELL', confidence: Math.min(95, 70 + Math.abs(score) * 5) };
    else return { type: 'HOLD', confidence: Math.max(50, 60 + score * 5) };
  }
}

async function generateForexSignals(historicalRates: { [date: string]: { [currency: string]: number } }): Promise<Signal[]> {
  const signals: Signal[] = [];
  // Major forex pairs (at least 25)
  const pairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
    'GBPAUD', 'EURAUD', 'GBPCAD', 'EURCAD', 'GBPNZD', 'EURNZD', 'AUDCAD',
    'AUDCHF', 'AUDNZD', 'CADCHF', 'NZDCHF'
  ];

  // Sort dates
  const dates = Object.keys(historicalRates).sort();

  for (const pair of pairs) {
    const base = pair.slice(0, 3);
    const quote = pair.slice(3);
    const prices: number[] = [];

    for (const date of dates) {
      const rates = historicalRates[date];
      let rate: number;
      if (quote === 'USD') {
        rate = rates[base] || 1;
      } else if (base === 'USD') {
        rate = 1 / (rates[quote] || 1);
      } else {
        rate = (rates[base] || 1) / (rates[quote] || 1);
      }
      prices.push(rate);
    }

    if (prices.length >= 50) { // Ensure we have enough data
      const signal = await generateSignalForPair(prices);
      const currentPrice = prices[prices.length - 1];
      const takeProfit = signal.type === 'BUY' ? currentPrice * 1.05 : signal.type === 'SELL' ? currentPrice * 0.95 : currentPrice;
      const stopLoss = signal.type === 'BUY' ? currentPrice * 0.98 : signal.type === 'SELL' ? currentPrice * 1.02 : currentPrice;

      signals.push({
        symbol: pair,
        type: signal.type,
        indicator: 'AI-Driven Multi-Indicator Analysis',
        confidence: signal.confidence,
        takeProfit,
        stopLoss
      });
    }
  }

  return signals;
}

export async function GET() {
  unstable_noStore();
  try {
    const key = 'bf9bb1eae145f608dac50ee8';
    const symbols = ['EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

    // Fetch current rates from ExchangeRate-API (free)
    const url = `https://v6.exchangerate-api.com/v6/${key}/latest/USD`;
    const response = await axios.get(url);
    const currentRates = response.data.conversion_rates;

    // Generate mock historical data based on current rates
    const historicalRates: { [date: string]: { [currency: string]: number } } = {};
    const endDate = new Date();
    for (let i = 49; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      historicalRates[dateStr] = {};
      for (const symbol of symbols) {
        const baseRate = currentRates[symbol];
        // Generate realistic historical prices with slight variations
        const variation = (Math.sin(i / 15) * 0.02) + (Math.random() - 0.5) * 0.01;
        historicalRates[dateStr][symbol] = baseRate * (1 + variation);
      }
    }

    const signals = await generateForexSignals(historicalRates);
    return NextResponse.json({ signals, rates: response.data });
  } catch (error) {
    console.error('API Error:', error);
    // Fallback signals in case of error
    const fallbackSignals: Signal[] = [
      { symbol: 'EURUSD', type: 'HOLD', indicator: 'Fallback Mode', confidence: 50, takeProfit: 1.08, stopLoss: 1.06 },
      { symbol: 'GBPUSD', type: 'HOLD', indicator: 'Fallback Mode', confidence: 50, takeProfit: 1.28, stopLoss: 1.26 },
      { symbol: 'USDJPY', type: 'HOLD', indicator: 'Fallback Mode', confidence: 50, takeProfit: 150, stopLoss: 148 },
    ];
    return NextResponse.json({ signals: fallbackSignals, error: 'Using fallback data' });
  }
}