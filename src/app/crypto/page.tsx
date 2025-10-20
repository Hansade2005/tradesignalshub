'use client';

import { useEffect, useState } from 'react';
import SignalCard from '@/components/SignalCard';
import { Signal } from '@/lib/signals';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CryptoPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<string>('BTC');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/crypto');
        const { signals: sig, data: cryptoData } = await res.json();
        setSignals(sig);
        setData(cryptoData);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div></div>;

  const selectedData = data.find(coin => coin.symbol.toUpperCase() === selectedCoin) || data[0];
  const chartData = selectedData?.sparkline_in_7d?.price.map((price: number, index: number) => ({ time: index, price: parseFloat(price.toFixed(2)) })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">🚀 Crypto Trading Signals</h1>
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Coin for Chart:</label>
          <select
            value={selectedCoin}
            onChange={(e) => setSelectedCoin(e.target.value)}
            className="block w-full max-w-xs p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {data.slice(0, 10).map((coin: any) => (
              <option key={coin.id} value={coin.symbol.toUpperCase()}>{coin.name} ({coin.symbol.toUpperCase()})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {signals.slice(0, 9).map((signal, idx) => (
            <SignalCard key={idx} signal={signal} />
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">{selectedCoin} Price Chart (7-Day)</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Price']} />
              <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}