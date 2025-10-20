import { NextResponse } from 'next/server';
import axios from 'axios';

interface Signal {
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  confidence: number;
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

// Advanced AI-driven signal generation with multiple indicators
function generateSignalForPair(prices: number[]): { type: 'BUY' | 'SELL' | 'HOLD'; confidence: number } {
  let score = 0;

  // RSI (Oversold <30 buy, Overbought >70 sell)
  const rsiValues = calculateRSI(prices);
  const rsi = rsiValues[rsiValues.length - 1];
  if (rsi < 30) score += 2; // Strong buy
  else if (rsi > 70) score -= 2; // Strong sell
  else if (rsi < 50) score += 1;
  else if (rsi > 50) score -= 1;

  // SMA Crossover (Short > Long buy, vice versa sell)
  const sma5 = calculateSMA(prices, 5);
  const sma10 = calculateSMA(prices, 10);
  if (sma5[sma5.length - 1] > sma10[sma10.length - 1]) score += 1.5;
  else if (sma5[sma5.length - 1] < sma10[sma10.length - 1]) score -= 1.5;

  // EMA Crossover
  const ema5 = calculateEMA(prices, 5);
  const ema10 = calculateEMA(prices, 10);
  if (ema5[ema5.length - 1] > ema10[ema10.length - 1]) score += 1;
  else if (ema5[ema5.length - 1] < ema10[ema10.length - 1]) score -= 1;

  // MACD
  const { macd, signal, histogram } = calculateMACD(prices);
  if (macd[macd.length - 1] > signal[signal.length - 1] && histogram[histogram.length - 1] > 0) score += 1.5;
  else if (macd[macd.length - 1] < signal[signal.length - 1] && histogram[histogram.length - 1] < 0) score -= 1.5;

  // Bollinger Bands
  const { upper, middle, lower } = calculateBollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  if (currentPrice < lower[lower.length - 1]) score += 2; // Below lower, buy
  else if (currentPrice > upper[upper.length - 1]) score -= 2; // Above upper, sell

  // Stochastic
  const { k, d } = calculateStochastic(prices);
  const kVal = k[k.length - 1];
  const dVal = d[d.length - 1];
  if (kVal < 20 && dVal < 20) score += 1.5; // Oversold
  else if (kVal > 80 && dVal > 80) score -= 1.5; // Overbought

  // Decision based on score
  if (score >= 4) return { type: 'BUY', confidence: Math.min(95, 70 + score * 5) };
  else if (score <= -4) return { type: 'SELL', confidence: Math.min(95, 70 + Math.abs(score) * 5) };
  else return { type: 'HOLD', confidence: Math.max(50, 60 + score * 5) };
}

function generateForexSignals(rates: { [key: string]: number }): Signal[] {
  const signals: Signal[] = [];
  // Major forex pairs (at least 25)
  const pairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD',
    'EURJPY', 'GBPJPY', 'EURGBP', 'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
    'GBPAUD', 'EURAUD', 'GBPCAD', 'EURCAD', 'GBPNZD', 'EURNZD', 'AUDCAD',
    'AUDCHF', 'AUDNZD', 'CADCHF', 'NZDCHF'
  ];

  pairs.forEach(pair => {
    const base = pair.slice(0, 3);
    const quote = pair.slice(3);
    let rate: number;
    if (quote === 'USD') {
      rate = rates[base] || 1;
    } else if (base === 'USD') {
      rate = 1 / (rates[quote] || 1);
    } else {
      rate = (rates[base] || 1) / (rates[quote] || 1);
    }

    // Generate mock historical prices for AI analysis (in production, use real historical data)
    const mockPrices = Array.from({ length: 50 }, (_, i) => rate + (Math.sin(i / 15) * 0.02) + (Math.random() - 0.5) * 0.01);

    const signal = generateSignalForPair(mockPrices);
    signals.push({
      symbol: pair,
      type: signal.type,
      indicator: 'AI-Driven Multi-Indicator Analysis',
      confidence: signal.confidence
    });
  });

  return signals;
}

export async function GET() {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const signals = generateForexSignals(response.data.rates);
    return NextResponse.json({ signals, rates: response.data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch forex data' }, { status: 500 });
  }
}