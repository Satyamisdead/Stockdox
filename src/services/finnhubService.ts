
'use server';

import type { FinnhubQuote, FinnhubProfile, Asset } from '@/types';
import { placeholderAssets } from '@/lib/placeholder-data';

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

async function fetchQuoteFromYahoo(symbol: string): Promise<FinnhubQuote | null> {
  // Format specific common symbols for Yahoo if needed (e.g. AAPL is standard)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1d&range=1d`;
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      console.warn(`Yahoo Finance fallback failed for ${symbol}: ${response.status}`);
      return null;
    }
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
    
    return {
      c: price,
      d: change,
      dp: changePercent,
      h: meta.regularMarketDayHigh || price,
      l: meta.regularMarketDayLow || price,
      o: meta.regularMarketDayHigh || price,
      pc: prevClose,
      t: meta.regularMarketTime || Math.floor(Date.now() / 1000)
    };
  } catch (error) {
    console.error(`Yahoo Finance fetch error for ${symbol}:`, error);
    return null;
  }
}

async function fetchQuoteBySymbol(symbol: string): Promise<FinnhubQuote | null> {
  let quote: FinnhubQuote | null = null;
  
  if (API_KEY) {
    const url = `${FINNHUB_API_BASE_URL}/quote?symbol=${symbol.toUpperCase()}&token=${API_KEY}`;
    try {
      const response = await fetchWithTimeout(url, { next: { revalidate: 60 } });
      if (response.ok) {
        const data: FinnhubQuote = await response.json();
        if (!(data.c === 0 && data.pc === 0 && data.t === 0)) {
          quote = data;
        }
      }
    } catch (error) {
      // Ignore and proceed to fallback
    }
  }
  
  if (!quote) {
    console.log(`Finnhub quote failed/rate-limited for ${symbol}. Falling back to Yahoo Finance...`);
    quote = await fetchQuoteFromYahoo(symbol);
  }
  
  return quote;
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
    } else {
        // Fallback static profile information from placeholders if API profile fails
        const placeholder = placeholderAssets.find(a => a.symbol.toUpperCase() === symbol.toUpperCase());
        if (placeholder) {
            assetDetails.name = placeholder.name;
            assetDetails.sector = placeholder.sector;
            assetDetails.exchange = placeholder.exchange;
            assetDetails.logoUrl = placeholder.logoUrl;
            if (!assetDetails.marketCap) {
                assetDetails.marketCap = placeholder.marketCap;
            }
        }
    }

    return assetDetails;
  } catch (error) {
    console.error(`Failed to fetch combined stock details for ${symbol}`, error);
    return null;
  }
}
