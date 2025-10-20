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

function generateCryptoSignals(data: any[]): Signal[] {
  const signals: Signal[] = [];
  data.forEach(coin => {
    const prices = coin.sparkline_in_7d?.price || [];
    if (prices.length < 50) return; // Need enough data

    // RSI
    const rsiValues = calculateRSI(prices, 14);
    if (rsiValues.length > 0) {
      const rsi = rsiValues[rsiValues.length - 1];
      if (rsi < 30) signals.push({ symbol: coin.symbol.toUpperCase(), type: 'BUY', indicator: 'RSI', confidence: Math.round((30 - rsi) / 30 * 100) });
      else if (rsi > 70) signals.push({ symbol: coin.symbol.toUpperCase(), type: 'SELL', indicator: 'RSI', confidence: Math.round((rsi - 70) / 30 * 100) });
    }

    // SMA Crossover
    const smaShort = calculateSMA(prices, 10);
    const smaLong = calculateSMA(prices, 20);
    if (smaShort.length > 1 && smaLong.length > 1) {
      const lastShort = smaShort[smaShort.length - 1];
      const prevShort = smaShort[smaShort.length - 2];
      const lastLong = smaLong[smaLong.length - 1];
      const prevLong = smaLong[smaLong.length - 2];
      if (lastShort > lastLong && prevShort <= prevLong) {
        signals.push({ symbol: coin.symbol.toUpperCase(), type: 'BUY', indicator: 'SMA Crossover', confidence: 75 });
      } else if (lastShort < lastLong && prevShort >= prevLong) {
        signals.push({ symbol: coin.symbol.toUpperCase(), type: 'SELL', indicator: 'SMA Crossover', confidence: 75 });
      }
    }

    // MACD
    const { macd, signal, histogram } = calculateMACD(prices);
    if (histogram.length > 1) {
      const lastHist = histogram[histogram.length - 1];
      const prevHist = histogram[histogram.length - 2];
      if (lastHist > 0 && prevHist < 0) {
        signals.push({ symbol: coin.symbol.toUpperCase(), type: 'BUY', indicator: 'MACD', confidence: 80 });
      } else if (lastHist < 0 && prevHist > 0) {
        signals.push({ symbol: coin.symbol.toUpperCase(), type: 'SELL', indicator: 'MACD', confidence: 80 });
      }
    }
  });
  return signals;
}

export async function GET() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        page: 1,
        sparkline: true,
        price_change_percentage: '24h'
      }
    });
    const signals = generateCryptoSignals(response.data);
    return NextResponse.json({ signals, data: response.data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch crypto data' }, { status: 500 });
  }
}