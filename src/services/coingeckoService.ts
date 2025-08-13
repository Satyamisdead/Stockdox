
'use server';

import type { CoinGeckoMarketData, Asset } from '@/types';

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
const API_REQUEST_TIMEOUT = 10000; // 10 seconds
const API_KEY = "CG-wGKXyitz7bf4Cj6rb3WESLUV";

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

async function fetchMarketData(ids: string[]): Promise<CoinGeckoMarketData[] | null> {
    if (!API_KEY) {
        console.error("CoinGecko API key is missing.");
        return null;
    }
    if (ids.length === 0) {
        return [];
    }
    
    const idsString = ids.join(',');
    const url = `${COINGECKO_API_BASE_URL}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false&x_cg_demo_api_key=${API_KEY}`;
    
    try {
        const response = await fetchWithTimeout(url, { next: { revalidate: 60 } }); // Revalidate every 60 seconds
        if (!response.ok) {
            console.error(`Error fetching crypto data from CoinGecko: ${response.status} ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

export async function fetchQuotesForMultipleCryptos(ids: string[]): Promise<Record<string, Partial<Asset>>> {
    const marketData = await fetchMarketData(ids);
    const quotes: Record<string, Partial<Asset>> = {};

    if (marketData) {
        marketData.forEach(crypto => {
            quotes[crypto.id] = {
                price: crypto.current_price,
                change24h: crypto.price_change_percentage_24h,
                dailyChange: crypto.price_change_24h,
            };
        });
    }

    return quotes;
}


export async function fetchCryptoDetails(id: string): Promise<Partial<Asset> | null> {
    const marketData = await fetchMarketData([id]);

    if (!marketData || marketData.length === 0) {
        return null;
    }

    const crypto = marketData[0];
    
    return {
        name: crypto.name,
        symbol: crypto.symbol,
        price: crypto.current_price,
        change24h: crypto.price_change_percentage_24h,
        dailyHigh: crypto.high_24h,
        dailyLow: crypto.low_24h,
        marketCap: crypto.market_cap,
        logoUrl: crypto.image,
        volume24h: crypto.total_volume,
        circulatingSupply: crypto.circulating_supply,
        allTimeHigh: crypto.ath,
    };
}
