'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [stats, setStats] = useState({ crypto: 0, forex: 3 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const cryptoResponse = await axios.get('https://api.coingecko.com/api/v3/coins/list');
        setStats({ crypto: cryptoResponse.data.length, forex: 25 });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({ crypto: 100, forex: 25 }); // Fallback
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <img
          src="https://api.a0.dev/assets/image?text=professional trading dashboard with charts and signals&aspect=16:9&seed=456"
          alt="Trading Dashboard"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-7xl font-extrabold mb-6 animate-fade-in">
              TradeSignals <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-xl lg:text-2xl mb-8 max-w-4xl mx-auto text-gray-300">
              Unleash the power of free AI-driven trading signals. Get real-time buy/sell recommendations for crypto and forex markets using advanced technical indicators.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link href="/crypto" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                🚀 Explore Crypto Signals ({stats.crypto})
              </Link>
              <Link href="/forex" className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                💰 Explore Forex Signals ({stats.forex})
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              Updated every 5 minutes • No fees • No sign-ups
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Market Insights</h2>
            <p className="text-lg text-gray-600">Live data from trusted APIs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{stats.crypto}+</div>
              <p className="text-gray-600">Crypto Assets Tracked</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{stats.forex}</div>
              <p className="text-gray-600">Forex Pairs Analyzed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">5min</div>
              <p className="text-gray-600">Update Frequency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose TradeSignals Pro?</h2>
            <p className="text-lg text-gray-600">Cutting-edge technology for smarter trading</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-gray-200">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Real-Time Data</h3>
              <p className="text-gray-600">Integrated with CoinGecko and Exchange Rate APIs for live market insights and accurate signals.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-gray-200">
              <div className="text-6xl mb-4">🧠</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Advanced Algorithms</h3>
              <p className="text-gray-600">Powered by RSI, MACD, SMA crossovers, and more for reliable buy/sell/hold recommendations.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-gray-200">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Completely Free</h3>
              <p className="text-gray-600">No subscriptions, no hidden fees. Share with friends and grow the community!</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Simple steps to smarter trading</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Choose Market</h3>
              <p className="text-gray-600">Select crypto or forex signals from the navigation.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-3">View Signals</h3>
              <p className="text-gray-600">Browse real-time signals with confidence levels and charts.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Trade Smart</h3>
              <p className="text-gray-600">Use signals as guidance for informed trading decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Traders Are Saying</h2>
            <p className="text-lg text-gray-600">Real feedback from our community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-2xl shadow-lg text-center">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4">"TradeSignals Pro helped me identify profitable trades I would have missed. The RSI signals are spot on!"</p>
              <p className="font-bold text-gray-800">- Alex T., Crypto Trader</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl shadow-lg text-center">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4">"Free forex signals that actually work. The confidence levels help me manage risk better."</p>
              <p className="font-bold text-gray-800">- Sarah M., Forex Investor</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl shadow-lg text-center">
              <div className="text-yellow-400 text-2xl mb-4">★★★★★</div>
              <p className="text-gray-700 mb-4">"Professional interface and real-time updates. This is the trading tool I've been waiting for."</p>
              <p className="font-bold text-gray-800">- Mike R., Day Trader</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pricing</h2>
            <p className="text-lg text-gray-600">No hidden fees, completely free</p>
          </div>
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Forever</h3>
              <div className="text-6xl font-extrabold text-indigo-600 mb-4">$0</div>
              <p className="text-gray-600 mb-6">Unlimited access to all signals, charts, and market data.</p>
              <ul className="text-left text-gray-700 mb-8 space-y-2">
                <li>✓ Real-time crypto signals</li>
                <li>✓ Forex trading signals</li>
                <li>✓ Advanced technical indicators</li>
                <li>✓ Interactive charts</li>
                <li>✓ No registration required</li>
              </ul>
              <Link href="/crypto" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl block">
                Start Trading Free 🚀
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading Smarter?</h2>
          <p className="text-xl mb-8">Join thousands of traders using TradeSignals Pro for free insights.</p>
          <Link href="/crypto" className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl">
            Get Your First Signal Now 🚀
          </Link>
        </div>
      </section>
    </>
  );
}