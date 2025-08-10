
'use server'; // Can be used by server components/actions if needed, but fetch is client-side here.

import type { FinnhubQuote, FinnhubProfile } from '@/types';

const FINNHUB_API_BASE_URL = 'https://finnhub.io/api/v1';
const API_REQUEST_TIMEOUT = 10000; // 10 seconds

let API_KEY: string | undefined = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "cn21b0pr01qj8h2b5vmgcn21b0pr01qj8h2b5vn0";

if (typeof window !== 'undefined' && !API_KEY) {
  console.error(
    "Finnhub Service: NEXT_PUBLIC_FINNHUB_API_KEY is not defined in your .env.local file. Finnhub API calls will fail."
  );
}

// This function is for client-side use to ensure API_KEY is available after initial render.
const getApiKey = (): string | undefined => {
  if (typeof window !== 'undefined') {
    API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "cn21b0pr01qj8h2b5vmgcn21b0pr01qj8h2b5vn0";
    if (!API_KEY) {
      console.error("Finnhub API Key is missing. Ensure NEXT_PUBLIC_FINNHUB_API_KEY is set.");
    }
  }
  return API_KEY;
}

async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if ((error as Error).name === 'AbortError') {
      console.warn(`Request to ${url} timed out after ${timeout}ms.`);
    } else {
      console.error(`Exception during fetch to ${url}:`, error);
    }
    throw error; // Re-throw to be handled by the caller
  }
}

export async function fetchQuoteBySymbol(symbol: string): Promise<FinnhubQuote | null> {
  const currentApiKey = getApiKey();
  if (!currentApiKey) {
    return null;
  }
  const url = `${FINNHUB_API_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${currentApiKey}`;
  try {
    const response = await fetchWithTimeout(url, API_REQUEST_TIMEOUT);
    if (!response.ok) {
      console.error(`Error fetching quote for ${symbol}: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error("Finnhub error details:", errorData);
      return null;
    }
    const data: FinnhubQuote = await response.json();
    if (data.c === 0 && data.pc === 0 && data.o === 0 && data.h === 0 && data.l === 0 && data.t === 0) {
        console.warn(`Finnhub returned all zero values for quote ${symbol}, likely an invalid symbol or no data available.`);
        return null;
    }
    return data;
  } catch (error) {
    // Error logging is handled in fetchWithTimeout or if response is not ok
    return null;
  }
}

export async function fetchProfileBySymbol(symbol: string, assetType: 'stock' | 'crypto' = 'stock'): Promise<FinnhubProfile | null> {
  const currentApiKey = getApiKey();
  if (!currentApiKey) return null;

  if (assetType === 'crypto') {
    return {
      name: symbol.toUpperCase(),
      ticker: symbol.toUpperCase(),
      finnhubIndustry: 'Cryptocurrency',
    };
  }
  const url = `${FINNHUB_API_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${currentApiKey}`;
  try {
    const response = await fetchWithTimeout(url, API_REQUEST_TIMEOUT);
    if (!response.ok) {
      console.error(`Error fetching profile for ${symbol}: ${response.status} ${response.statusText}`);
      const errorData = await response.text();
      console.error("Finnhub error details for profile:", errorData);
      return null;
    }
    const data: FinnhubProfile = await response.json();
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        console.warn(`Finnhub returned an empty profile object for ${symbol}.`);
        return null;
    }
    return data;
  } catch (error) {
    // Error logging is handled in fetchWithTimeout or if response is not ok
    return null;
  }
}
