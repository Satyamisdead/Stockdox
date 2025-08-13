
import type { LucideIcon } from 'lucide-react';

// --- Finnhub API Types ---
export interface FinnhubQuote {
  c: number; // Current price
  d: number | null; // Change
  dp: number | null; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubProfile {
  country?: string;
  currency?: string;
  exchange?: string;
  name?: string;
  ticker?: string;
  ipo?: string;
  marketCapitalization?: number;
  shareOutstanding?: number;
  logo?: string;
  phone?: string;
  weburl?: string;
  finnhubIndustry?: string;
}

// --- CoinGecko API Types ---
export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  ath: number;
}


// --- App's Internal Combined Asset Type ---
export interface Asset {
  id: string; // Unique identifier (coingecko id for crypto, ticker for stocks)
  symbol: string; // Ticker symbol (e.g., AAPL, BTC)
  name: string;
  type: 'stock' | 'crypto';
  
  // Common data points
  price?: number;
  change24h?: number | null; // Percent change
  marketCap?: number;
  logoUrl?: string;
  volume24h?: number;

  // UI specific
  dataAiHint?: string;
  icon?: LucideIcon | string;
  
  // Stock specific (from Finnhub)
  dailyChange?: number | null; // Absolute change
  dailyHigh?: number;
  dailyLow?: number;
  dailyOpen?: number;
  previousClose?: number;
  sector?: string;
  exchange?: string;
  peRatio?: number; 
  epsDilutedTTM?: number; 
  epsDilutedGrowthTTMYoY?: number; 
  dividendYieldTTM?: number; 
  relativeVolume?: number; 

  // Crypto specific (from CoinGecko)
  circulatingSupply?: number;
  allTimeHigh?: number;
}


export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
  imageUrl?: string;
}
