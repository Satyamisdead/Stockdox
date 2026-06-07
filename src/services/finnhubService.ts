
'use server';

import type { FinnhubQuote, FinnhubProfile, Asset } from '@/types';

const FINNHUB_API_BASE_URL = 'https://finnhub.io/api/v1';
const API_REQUEST_TIMEOUT = 10000; // 10 seconds

const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "cn21b0pr01qj8h2b5vmgcn21b0pr01qj8h2b5vn0";

if (typeof window !== 'undefined' && !API_KEY) {
  console.error(
    "Finnhub Service: NEXT_PUBLIC_FINNHUB_API_KEY is not defined in your .env.local file. Finnhub API calls will fail."
  );
}

async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      console.warn(`Request to ${url} timed out after ${API_REQUEST_TIMEOUT}ms.`);
    } else {
      console.error(`Exception during fetch to ${url}:`, error);
    }
    throw error;
  }
}

async function fetchQuoteBySymbol(symbol: string): Promise<FinnhubQuote | null> {
  if (!API_KEY) return null;
  const url = `${FINNHUB_API_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${API_KEY}`;
  try {
    const response = await fetchWithTimeout(url, { next: { revalidate: 60 } }); // Revalidate every 60 seconds
    if (!response.ok) {
      console.error(`Error fetching quote for ${symbol}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: FinnhubQuote = await response.json();
    if (data.c === 0 && data.pc === 0 && data.t === 0) {
        return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

export async function fetchQuotesForMultipleStocks(symbols: string[]): Promise<Record<string, Partial<Asset>>> {
    const quotePromises = symbols.map(symbol => fetchQuoteBySymbol(symbol));
    const results = await Promise.allSettled(quotePromises);

    const quotes: Record<string, Partial<Asset>> = {};

    results.forEach((result, index) => {
        const symbol = symbols[index];
        if (result.status === 'fulfilled' && result.value) {
            const quote = result.value;
            quotes[symbol] = {
                price: quote.c,
                change24h: quote.dp,
                dailyChange: quote.d,
            };
        } else if (result.status === 'rejected') {
            console.error(`Failed to fetch quote for ${symbol}:`, result.reason);
        }
    });

    return quotes;
}


async function fetchProfileBySymbol(symbol: string): Promise<FinnhubProfile | null> {
  if (!API_KEY) return null;

  const url = `${FINNHUB_API_BASE_URL}/stock/profile2?symbol=${symbol.toUpperCase()}&token=${API_KEY}`;
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      console.error(`Error fetching profile for ${symbol}: ${response.status} ${response.statusText}`);
      return null;
    }
    const data: FinnhubProfile = await response.json();
    if (Object.keys(data).length === 0) {
        return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

export async function fetchStockDetails(symbol: string): Promise<Partial<Asset> | null> {
  try {
    const [quoteData, profileData] = await Promise.all([
      fetchQuoteBySymbol(symbol),
      fetchProfileBySymbol(symbol)
    ]);

    if (!quoteData && !profileData) {
        return null;
    }

    const assetDetails: Partial<Asset> = {};

    if (quoteData) {
        assetDetails.price = quoteData.c;
        assetDetails.change24h = quoteData.dp;
        assetDetails.dailyChange = quoteData.d;
        assetDetails.dailyHigh = quoteData.h;
        assetDetails.dailyLow = quoteData.l;
        assetDetails.dailyOpen = quoteData.o;
        assetDetails.previousClose = quoteData.pc;
    }

    if (profileData) {
        assetDetails.marketCap = profileData.marketCapitalization ? profileData.marketCapitalization * 1e6 : undefined;
        assetDetails.sector = profileData.finnhubIndustry;
        assetDetails.logoUrl = profileData.logo;
        assetDetails.exchange = profileData.exchange;
        assetDetails.name = profileData.name;
    }

    return assetDetails;
  } catch (error) {
    console.error(`Failed to fetch combined stock details for ${symbol}`, error);
    return null;
  }
}
