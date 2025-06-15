
'use server'; // Can be used by server components/actions if needed, but fetch is client-side here.

import type { FinnhubQuote, FinnhubProfile } from '@/types';

const FINNHUB_API_BASE_URL = 'https://finnhub.io/api/v1';
let API_KEY: string | undefined = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

if (typeof window !== 'undefined' && !API_KEY) {
  console.error(
    "Finnhub Service: NEXT_PUBLIC_FINNHUB_API_KEY is not defined in your .env.local file. Finnhub API calls will fail."
  );
}
// This function is for client-side use to ensure API_KEY is available after initial render.
const getApiKey = (): string | undefined => {
  if (typeof window !== 'undefined') {
    API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!API_KEY) {
      // This log might be redundant if the above already caught it, but good for direct calls.
      console.error("Finnhub API Key is missing. Ensure NEXT_PUBLIC_FINNHUB_API_KEY is set.");
    }
  }
  return API_KEY;
}

export async function fetchQuoteBySymbol(symbol: string): Promise<FinnhubQuote | null> {
  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    return null;
  }
  try {
    const response = await fetch(`${FINNHUB_API_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${currentApiKey}`);
    if (!response.ok) {
      console.error(`Error fetching quote for ${symbol}: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error("Finnhub error details:", errorData);
      return null;
    }
    const data: FinnhubQuote = await response.json();
    // Finnhub returns 0 for all fields if symbol is not found or other issues.
    // A more robust check might be needed if 0 is a valid price for some assets.
    if (data.c === 0 && data.pc === 0 && data.t === 0) {
        console.warn(`Finnhub returned all zeros for ${symbol}, might be an invalid symbol or no data.`);
        return null; // Or handle as "no data"
    }
    return data;
  } catch (error) {
    console.error(`Exception fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function fetchProfileBySymbol(symbol: string, assetType: 'stock' | 'crypto' = 'stock'): Promise<FinnhubProfile | null> {
  const currentApiKey = getApiKey();
  if (!currentApiKey) return null;

  // For crypto, Finnhub doesn't have a direct "profile" like stocks.
  // We can return a basic profile or fetch other relevant crypto data later.
  // For now, if it's crypto, we might just return name/ticker from a predefined list or other source.
  // This example focuses on stock profiles.
  if (assetType === 'crypto') {
    // Basic profile for crypto
    return {
      name: symbol.toUpperCase(), // Often name and symbol are same or similar
      ticker: symbol.toUpperCase(),
      finnhubIndustry: 'Cryptocurrency',
      logo: `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol.toUpperCase()}--big.svg` // Default TV logo pattern
    };
  }

  try {
    const response = await fetch(`${FINNHUB_API_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${currentApiKey}`);
    if (!response.ok) {
      console.error(`Error fetching profile for ${symbol}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: FinnhubProfile = await response.json();
    if (Object.keys(data).length === 0) { // Finnhub returns empty object for unknown symbols
        console.warn(`Finnhub returned an empty profile for ${symbol}.`);
        return null;
    }
    return data;
  } catch (error) {
    console.error(`Exception fetching profile for ${symbol}:`, error);
    return null;
  }
}
