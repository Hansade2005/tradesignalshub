import axios from 'axios';

// Define tool types
export interface Tool {
  name: string;
  description: string;
  parameters: any; // JSON Schema for parameters
  execute: (args: any) => Promise<any>;
}

// Allowed tools
export const allowedTools: Tool[] = [
  {
    name: 'fetchCryptoPrice',
    description: 'Fetch current price and data for a cryptocurrency',
    parameters: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Cryptocurrency symbol (e.g., BTC, ETH)' }
      },
      required: ['symbol']
    },
    execute: async (args: { symbol: string }) => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: args.symbol.toLowerCase(),
            vs_currencies: 'usd',
            include_24hr_change: true
          }
        });
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch price for ${args.symbol}: ${error}`);
      }
    }
  },
  {
    name: 'fetchForexRate',
    description: 'Fetch current forex exchange rate',
    parameters: {
      type: 'object',
      properties: {
        pair: { type: 'string', description: 'Currency pair (e.g., EURUSD, GBPUSD)' }
      },
      required: ['pair']
    },
    execute: async (args: { pair: string }) => {
      try {
        const base = args.pair.slice(0, 3);
        const quote = args.pair.slice(3);
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${base}`);
        const rate = response.data.rates[quote];
        return { pair: args.pair, rate, timestamp: response.data.time_last_updated };
      } catch (error) {
        throw new Error(`Failed to fetch rate for ${args.pair}: ${error}`);
      }
    }
  },
  {
    name: 'callImageTool',
    description: 'Generate an image based on text description',
    parameters: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Text description for image generation' },
        aspect: { type: 'string', description: 'Aspect ratio (e.g., 1:1, 16:9)', default: '1:1' }
      },
      required: ['description']
    },
    execute: async (args: { description: string; aspect?: string }) => {
      try {
        const url = `https://api.a0.dev/assets/image?text=${encodeURIComponent(args.description)}&aspect=${args.aspect || '1:1'}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Image generation failed');
        const blob = await response.blob();
        const dataUrl = await blobToDataURL(blob);
        return { imageUrl: dataUrl, description: args.description };
      } catch (error) {
        throw new Error(`Failed to generate image: ${error}`);
      }
    }
  }
];

// Execute a tool by name with arguments
export async function executeTool(toolName: string, args: any): Promise<any> {
  const tool = allowedTools.find(t => t.name === toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' not found`);
  }
  return await tool.execute(args);
}

// Helper function to convert blob to data URL
async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}