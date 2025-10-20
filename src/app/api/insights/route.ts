import { NextRequest, NextResponse } from 'next/server';
import { callA0LLM } from '@/lib/a0llm';

export async function GET() {
  try {
    // Fetch current crypto data for insights
    const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
    const cryptoData = await cryptoResponse.json();

    // Fetch forex data
    const forexResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const forexData = await forexResponse.json();

    // Prepare prompt for LLM
    const prompt = `
You are an expert market analyst. Based on the following current market data, provide a concise market insights summary (2-3 paragraphs) including:
- Overall market sentiment
- Key trends in crypto and forex
- Potential opportunities or risks
- Brief advice for traders

Crypto Data (top 10 by market cap):
${cryptoData.map((coin: any) => `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price}, 24h change: ${coin.price_change_percentage_24h.toFixed(2)}%`).join('\n')}

Forex Data (major pairs rates):
${Object.entries(forexData.rates).slice(0, 10).map(([pair, rate]: [string, any]) => `${pair}: ${rate}`).join('\n')}

Provide insights in a professional, informative tone.`;

    const messages = [
      { role: 'system' as const, content: 'You are an expert market analyst providing trading insights.' },
      { role: 'user' as const, content: prompt }
    ];

    const insights = await callA0LLM(messages);

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}