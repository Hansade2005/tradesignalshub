import React from 'react';

interface Signal {
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  indicator: string;
  confidence: number;
  takeProfit: number;
  stopLoss: number;
}

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const getColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-green-600 bg-green-100 border-green-300';
      case 'SELL': return 'text-red-600 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      default: return '➡️';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(signal.symbol.includes('JPY') ? 2 : 4);
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border-2 ${getColor(signal.type)} animate-fade-in`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold text-gray-800">{signal.symbol}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getColor(signal.type)} flex items-center`}>
          {getIcon(signal.type)} {signal.type}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-1">Indicator: <strong>{signal.indicator}</strong></p>
      <p className="text-sm text-gray-600 mb-1">Confidence: <strong>{signal.confidence}%</strong></p>
      <p className="text-sm text-gray-600 mb-1">Take Profit: <strong className="text-green-600">${formatPrice(signal.takeProfit)}</strong></p>
      <p className="text-sm text-gray-600 mb-1">Stop Loss: <strong className="text-red-600">${formatPrice(signal.stopLoss)}</strong></p>
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${signal.type === 'BUY' ? 'bg-green-500' : signal.type === 'SELL' ? 'bg-red-500' : 'bg-gray-500'}`} style={{ width: `${signal.confidence}%` }}></div>
      </div>
    </div>
  );
};

export default SignalCard;