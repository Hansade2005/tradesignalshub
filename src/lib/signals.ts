export interface Signal {
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  confidence: number;
  takeProfit: number;
  stopLoss: number;
}