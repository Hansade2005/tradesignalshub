'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            TradeSignals Pro
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-700 hover:text-indigo-600 transition-colors">Home</Link>
            <Link href="/crypto" className="text-gray-700 hover:text-indigo-600 transition-colors">Crypto Signals</Link>
            <Link href="/forex" className="text-gray-700 hover:text-indigo-600 transition-colors">Forex Signals</Link>
          </nav>
          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {isOpen && (
          <div className="md:hidden pb-4">
            <Link href="/" className="block py-2 text-gray-700 hover:text-indigo-600" onClick={() => setIsOpen(false)}>Home</Link>
            <Link href="/crypto" className="block py-2 text-gray-700 hover:text-indigo-600" onClick={() => setIsOpen(false)}>Crypto Signals</Link>
            <Link href="/forex" className="block py-2 text-gray-700 hover:text-indigo-600" onClick={() => setIsOpen(false)}>Forex Signals</Link>
          </div>
        )}
      </div>
    </header>
  );
}