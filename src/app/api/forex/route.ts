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

function generateForexSignals(rates: { [key: string]: number }): Signal[] {
  const signals: Signal[] = [];
  const pairs = ['EURUSD', 'GBPUSD', 'USDJPY'];
  pairs.forEach(pair => {
    const base = pair.slice(0, 3);
    const quote = pair.slice(3);
    const rate = rates[base] / rates[quote] || 1.1; // Fallback
    // For production, fetch historical data from a free API like exchangerate-api.com
    // For now, generate mock historical prices based on current rate for demonstration
    const mockPrices = Array.from({ length: 30 }, (_, i) => rate + (Math.sin(i / 10) * 0.01) + Math.random() * 0.005);
    const smaShort = calculateSMA(mockPrices, 5);
    const smaLong = calculateSMA(mockPrices, 10);
    const rsiValues = calculateRSI(mockPrices, 14);
    const rsi = rsiValues[rsiValues.length - 1];
    if (smaShort[smaShort.length - 1] > smaLong[smaLong.length - 1] && rsi < 40) {
      signals.push({ symbol: pair, type: 'BUY', indicator: 'SMA + RSI', confidence: 85 });
    } else if (smaShort[smaShort.length - 1] < smaLong[smaLong.length - 1] && rsi > 60) {
      signals.push({ symbol: pair, type: 'SELL', indicator: 'SMA + RSI', confidence: 85 });
    } else {
      signals.push({ symbol: pair, type: 'HOLD', indicator: 'Neutral', confidence: 50 });
    }
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