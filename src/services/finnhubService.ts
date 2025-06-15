
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
    // Check if critical price data is zero, indicating no useful data was returned.
    if (data.c === 0 && data.pc === 0 && data.o === 0 && data.h === 0 && data.l === 0 && data.t === 0) {
        console.warn(`Finnhub returned all zero values for quote ${symbol}, likely an invalid symbol or no data available.`);
        return null;
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

  if (assetType === 'crypto') {
    // For crypto, provide a basic profile; Finnhub's /stock/profile2 is for stocks.
    // Use a known pattern for TradingView SVG logos if direct Finnhub logo isn't available.
    // The placeholder-data.ts already has more specific logo URLs for crypto which are preferred.
    return {
      name: symbol.toUpperCase(),
      ticker: symbol.toUpperCase(),
      finnhubIndustry: 'Cryptocurrency',
      // logo: `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol.toUpperCase()}--big.svg` // This is a generic fallback, specific ones in placeholder data are better.
    };
  }

  try {
    const response = await fetch(`${FINNHUB_API_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${currentApiKey}`);
    if (!response.ok) {
      console.error(`Error fetching profile for ${symbol}: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error("Finnhub error details for profile:", errorData);
      return null;
    }
    const data: FinnhubProfile = await response.json();
    // Check if Finnhub returned an empty object, indicating symbol not found.
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        console.warn(`Finnhub returned an empty profile object for ${symbol}.`);
        return null;
    }
    return data;
  } catch (error) {
    console.error(`Exception fetching profile for ${symbol}:`, error);
    return null;
  }
}
