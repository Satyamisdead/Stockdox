
'use server';

import type { CoinGeckoMarketData, Asset } from '@/types';
import { placeholderAssets } from '@/lib/placeholder-data';

const COINGECKO_API_BASE_URL = 'https://api.coingecko.com/api/v3';
const API_REQUEST_TIMEOUT = 10000; // 10 seconds
const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "CG-wGKXyitz7bf4Cj6rb3WESLUV";

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

async function fetchMarketDataKeyless(ids: string[]): Promise<CoinGeckoMarketData[] | null> {
    if (ids.length === 0) return [];
    const idsString = ids.join(',');
    const url = `${COINGECKO_API_BASE_URL}/simple/price?ids=${idsString}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;
    
    try {
        const response = await fetch(url, { next: { revalidate: 60 } });
        if (!response.ok) {
            console.warn(`CoinGecko keyless fallback failed: ${response.status}`);
            return null;
        }
        const data = await response.json();
        const marketData: CoinGeckoMarketData[] = [];
        
        ids.forEach(id => {
            if (data[id]) {
                const coin = data[id];
                const placeholder = placeholderAssets.find(a => a.id === id);
                marketData.push({
                    id: id,
                    symbol: placeholder?.symbol || id.substring(0, 4).toUpperCase(),
                    name: placeholder?.name || (id.charAt(0).toUpperCase() + id.slice(1)),
                    image: placeholder?.logoUrl || 'https://placehold.co/60x60.png',
                    current_price: coin.usd,
                    market_cap: coin.usd_market_cap || placeholder?.marketCap || 0,
                    market_cap_rank: 0,
                    total_volume: coin.usd_24h_vol || placeholder?.volume24h || 0,
                    high_24h: coin.usd * 1.02,
                    low_24h: coin.usd * 0.98,
                    price_change_24h: (coin.usd_24h_change || 0) * coin.usd / 100,
                    price_change_percentage_24h: coin.usd_24h_change || 0,
                    circulating_supply: typeof placeholder?.circulatingSupply === 'number' ? placeholder.circulatingSupply : 0,
                    ath: typeof placeholder?.allTimeHigh === 'number' ? placeholder.allTimeHigh : coin.usd * 2
                });
            }
        });
        return marketData;
    } catch (error) {
        console.error("CoinGecko keyless fetch error:", error);
        return null;
    }
}

async function fetchMarketData(ids: string[]): Promise<CoinGeckoMarketData[] | null> {
    if (ids.length === 0) {
        return [];
    }

    let marketData: CoinGeckoMarketData[] | null = null;
    
    if (API_KEY) {
        const idsString = ids.join(',');
        const url = `${COINGECKO_API_BASE_URL}/coins/markets?vs_currency=usd&ids=${idsString}&order=market_cap_desc&per_page=${ids.length}&page=1&sparkline=false&x_cg_demo_api_key=${API_KEY}`;
        try {
            const response = await fetchWithTimeout(url, { next: { revalidate: 60 } });
            if (response.ok) {
                marketData = await response.json();
            } else {
                console.warn(`CoinGecko main fetch returned status: ${response.status}`);
            }
        } catch (error) {
            // Ignore error and proceed to keyless fallback
        }
    }
    
    if (!marketData) {
        console.log("CoinGecko primary fetch failed. Trying keyless simple/price fallback...");
        marketData = await fetchMarketDataKeyless(ids);
    }
    
    return marketData;
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
    const placeholder = placeholderAssets.find(a => a.id === id);
    
    return {
        name: crypto.name || placeholder?.name || id,
        symbol: placeholder?.symbol || crypto.symbol,
        price: crypto.current_price,
        change24h: crypto.price_change_percentage_24h,
        dailyHigh: crypto.high_24h,
        dailyLow: crypto.low_24h,
        marketCap: crypto.market_cap || placeholder?.marketCap,
        logoUrl: placeholder?.logoUrl || crypto.image,
        volume24h: crypto.total_volume || placeholder?.volume24h,
        circulatingSupply: typeof placeholder?.circulatingSupply === 'number' ? placeholder.circulatingSupply : undefined,
        allTimeHigh: typeof placeholder?.allTimeHigh === 'number' ? placeholder.allTimeHigh : undefined,
    };
}
