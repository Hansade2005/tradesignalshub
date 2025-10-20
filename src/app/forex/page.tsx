'use client';

import { useEffect, useState } from 'react';
import SignalCard from '@/components/SignalCard';
import { Signal } from '@/lib/signals';

export default function ForexPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/forex');
        const { signals: sig } = await res.json();
        setSignals(sig);
      } catch (error) {
        console.error('Error fetching forex data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">💰 Forex Trading Signals</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {signals.map((signal, idx) => (
            <SignalCard key={idx} signal={signal} />
          ))}
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">Signals updated every 5 minutes. Based on live exchange rates and technical analysis.</p>
        </div>
      </div>
    </div>
  );
}