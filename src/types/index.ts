
import type { LucideIcon } from 'lucide-react';

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

// Combined Asset type
export interface Asset {
  id: string; // Unique identifier, usually the symbol
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  
  price?: number; // From quote: c
  change24h?: number | null; // From quote: dp (percent change)
  dailyChange?: number | null; // From quote: d (absolute change)
  dailyHigh?: number;
  dailyLow?: number;
  dailyOpen?: number;
  previousClose?: number;

  marketCap?: number; // From profile: marketCapitalization
  logoUrl?: string; // From profile: logo
  sector?: string; // From profile: finnhubIndustry / or a crypto category
  exchange?: string; // From profile

  volume24h?: number; // Placeholder, as Finnhub's basic quote doesn't include volume for stocks directly in the same way as some crypto exchanges.
  
  dataAiHint?: string; // For Unsplash search keywords if logo is placeholder
  icon?: LucideIcon | string; // Fallback display icon if no logoUrl

  // Stock specific detailed metrics (can be populated from other Finnhub endpoints later)
  peRatio?: number; 
  epsDilutedTTM?: number; 
  epsDilutedGrowthTTMYoY?: number; 
  dividendYieldTTM?: number; 
  relativeVolume?: number; 

  // Crypto specific metrics (can be populated from other Finnhub endpoints later)
  circulatingSupply?: string; 
  allTimeHigh?: string; 
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
