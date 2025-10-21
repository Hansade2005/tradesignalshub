export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { unstable_noStore } from 'next/cache';
import axios from 'axios';
import { callA0LLM, Message, LLMResponse } from '@/lib/a0llm';

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

// Helper function to calculate MACD
function calculateMACD(prices: number[]): { macd: number[], signal: number[], histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd: number[] = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macd.push(ema12[i + 14] - ema26[i]); // adjust for lengths
  }
  // For simplicity, signal as EMA9 of macd
  const signal = calculateEMA(macd, 9);
  const histogram: number[] = [];
  for (let i = 0; i < Math.min(macd.length, signal.length); i++) {
    histogram.push(macd[i] - signal[i]);
  }
  return { macd, signal, histogram };
}

// Helper function to calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number[], middle: number[], lower: number[] } {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { upper, middle: sma, lower };
}

// Helper function to calculate Stochastic Oscillator
function calculateStochastic(prices: number[], kPeriod: number = 14, dPeriod: number = 3): { k: number[], d: number[] } {
  const k: number[] = [];
  for (let i = kPeriod - 1; i < prices.length; i++) {
    const high = Math.max(...prices.slice(i - kPeriod + 1, i + 1));
    const low = Math.min(...prices.slice(i - kPeriod + 1, i + 1));
    const current = prices[i];
    k.push(((current - low) / (high - low)) * 100);
  }
  const d = calculateSMA(k, dPeriod);
  return { k, d };
}

async function generateCryptoSignals(data: any[]): Promise<Signal[]> {
  const signals: Signal[] = [];
  for (const coin of data) {
    const prices = coin.sparkline_in_7d?.price || [];
    if (prices.length < 50) continue; // Need enough data

    // Calculate indicators
    const rsiValues = calculateRSI(prices, 14);
    const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : 50;

    const emaShort = calculateEMA(prices, 10);
    const emaLong = calculateEMA(prices, 20);
    const emaTrend = emaShort.length > 1 && emaLong.length > 1 ? (emaShort[emaShort.length - 1] > emaLong[emaLong.length - 1] ? 'bullish' : 'bearish') : 'neutral';

    const { histogram } = calculateMACD(prices);
    const macdSignal = histogram.length > 1 ? (histogram[histogram.length - 1] > 0 ? 'bullish' : 'bearish') : 'neutral';

    const { upper, lower } = calculateBollingerBands(prices, 20, 2);
    const bbPosition = upper.length > 0 && lower.length > 0 ? (prices[prices.length - 1] < lower[lower.length - 1] ? 'oversold' : prices[prices.length - 1] > upper[upper.length - 1] ? 'overbought' : 'normal') : 'normal';

    const { k, d } = calculateStochastic(prices, 14, 3);
    const stoch = k.length > 0 && d.length > 0 ? (k[k.length - 1] < 20 ? 'oversold' : k[k.length - 1] > 80 ? 'overbought' : 'normal') : 'normal';

    // LLM Prompt
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a professional cryptocurrency trading analyst with 20+ years experience. Analyze the technical indicators and provide a precise trading signal: BUY, SELL, or HOLD with confidence level (80-99%). Focus on high-profit opportunities for beginners. Be extremely accurate and conservative.'
      },
      {
        role: 'user',
        content: `Analyze ${coin.name} (${coin.symbol.toUpperCase()}):
- RSI: ${rsi.toFixed(2)} (${rsi < 30 ? 'oversold' : rsi > 70 ? 'overbought' : 'neutral'})
- EMA Trend: ${emaTrend}
- MACD: ${macdSignal}
- Bollinger Bands: ${bbPosition}
- Stochastic: ${stoch}
- Current Price: ${coin.current_price}
- 24h Change: ${coin.price_change_percentage_24h?.toFixed(2)}%

Provide signal in format: SIGNAL: BUY/SELL/HOLD, CONFIDENCE: XX%`
      }
    ];

    try {
      const response = await callA0LLM(messages, {
        temperature: 0.3,
        schema: {
          type: 'object',
          properties: {
            signal: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
            confidence: { type: 'number', minimum: 0, maximum: 100 }
          },
          required: ['signal', 'confidence']
        }
      });

      let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 85;

      if (response.schema_data && response.schema_data.signal && response.schema_data.confidence) {
        type = response.schema_data.signal;
        confidence = Math.min(99, Math.max(80, response.schema_data.confidence));
      } else {
        // Fallback to parsing completion
        const signalMatch = response.completion.match(/SIGNAL:\s*(BUY|SELL|HOLD)/i);
        const confidenceMatch = response.completion.match(/CONFIDENCE:\s*(\d+)%/i);

        if (signalMatch) {
          type = signalMatch[1].toUpperCase() as 'BUY' | 'SELL' | 'HOLD';
        }
        if (confidenceMatch) {
          confidence = Math.min(99, Math.max(80, parseInt(confidenceMatch[1])));
        }
      }

      const currentPrice = coin.current_price;
      const takeProfit = type === 'BUY' ? currentPrice * 1.05 : type === 'SELL' ? currentPrice * 0.95 : currentPrice;
      const stopLoss = type === 'BUY' ? currentPrice * 0.98 : type === 'SELL' ? currentPrice * 1.02 : currentPrice;

      signals.push({ symbol: coin.symbol.toUpperCase(), type, indicator: 'AI LLM Analysis', confidence, takeProfit, stopLoss });
    } catch (error) {
      console.error('LLM Error for', coin.symbol, error);
      // Fallback to rule-based
      let buyScore = 0, sellScore = 0;
      if (rsi < 30) buyScore += 2;
      if (emaTrend === 'bullish') buyScore += 1.5;
      if (macdSignal === 'bullish') buyScore += 1.5;
      if (bbPosition === 'oversold') buyScore += 1;
      if (stoch === 'oversold') buyScore += 1;
      if (rsi > 70) sellScore += 2;
      if (emaTrend === 'bearish') sellScore += 1.5;
      if (macdSignal === 'bearish') sellScore += 1.5;
      if (bbPosition === 'overbought') sellScore += 1;
      if (stoch === 'overbought') sellScore += 1;

      let type: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      let confidence = 70;
      if (buyScore > sellScore + 1) type = 'BUY', confidence = Math.min(95, 70 + (buyScore - sellScore) * 10);
      else if (sellScore > buyScore + 1) type = 'SELL', confidence = Math.min(95, 70 + (sellScore - buyScore) * 10);

      const currentPrice = coin.current_price;
      const takeProfit = type === 'BUY' ? currentPrice * 1.05 : type === 'SELL' ? currentPrice * 0.95 : currentPrice;
      const stopLoss = type === 'BUY' ? currentPrice * 0.98 : type === 'SELL' ? currentPrice * 1.02 : currentPrice;

      signals.push({ symbol: coin.symbol.toUpperCase(), type, indicator: 'Fallback Composite', confidence: Math.round(confidence), takeProfit, stopLoss });
    }
  }
  return signals;
}

export async function GET() {
  unstable_noStore();
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 200,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h'
      }
    });
    const signals = await generateCryptoSignals(response.data);
    return NextResponse.json({ signals, data: response.data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 });
  }
}