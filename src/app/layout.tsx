'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { usePathname } from 'next/navigation'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradeSignals Pro - Free Trading Signals for Crypto & Forex',
  description: 'Get free, real-time trading signals for crypto and forex markets using advanced technical indicators. Powered by CoinGecko and Exchange Rate APIs.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const hideFooter = pathname.startsWith('/ai-advisor');

  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main>{children}</main>
        {!hideFooter && <Footer />}
      </body>
    </html>
  )
}