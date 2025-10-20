// Tool functions for TradeSignals Pro
// These are executed client-side for tool invocation pattern

export async function fetchCryptoPrice(symbol: string): Promise<{ price: number; timestamp: string }> {
  // Use CoinGecko free API for crypto prices
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${symbol} price`);
  const data = await res.json();
  const price = data[symbol.toLowerCase()]?.usd;
  if (!price) throw new Error(`Price not found for ${symbol}`);
  return { price, timestamp: new Date().toISOString() };
}

export async function fetchForexRate(pair: string): Promise<{ rate: number; timestamp: string }> {
  // Use free exchangerate-api for forex
  const url = `https://api.exchangerate-api.com/v6/latest/USD`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch forex rates`);
  const data = await res.json();
  const rates = data.rates;
  // pair is like EURUSD, but API is USD-based, so for EUR, rate is rates.EUR
  const base = pair.slice(0, 3);
  const quote = pair.slice(3);
  const baseRate = rates[base];
  const quoteRate = rates[quote];
  if (!baseRate || !quoteRate) throw new Error(`Rate not found for ${pair}`);
  const rate = quoteRate / baseRate; // Assuming USD is common
  return { rate, timestamp: new Date().toISOString() };
}

export async function callImageTool(prompt: string, aspect: string = '1:1', seed?: number): Promise<string> {
  // Use a0.dev image generation
  const url = new URL('https://api.a0.dev/assets/image');
  url.searchParams.set('text', prompt);
  if (aspect) url.searchParams.set('aspect', aspect);
  if (seed) url.searchParams.set('seed', String(seed));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Image generation failed');
  const blob = await res.blob();
  // Convert to data URL for easy handling
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:${blob.type};base64,${base64}`;
}

// Allowed tools for validation
export const allowedTools = ['fetchCryptoPrice', 'fetchForexRate', 'callImageTool'];

// Execute tool safely
export async function executeTool(toolName: string, args: any): Promise<any> {
  if (!allowedTools.includes(toolName)) {
    throw new Error(`Tool ${toolName} not allowed`);
  }
  switch (toolName) {
    case 'fetchCryptoPrice':
      return fetchCryptoPrice(args.symbol);
    case 'fetchForexRate':
      return fetchForexRate(args.pair);
    case 'callImageTool':
      return callImageTool(args.prompt, args.aspect, args.seed);
    default:
      throw new Error(`Unknown tool ${toolName}`);
  }
}