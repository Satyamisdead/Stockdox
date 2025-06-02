import type { LucideIcon } from 'lucide-react';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: 'stock' | 'crypto';
  price: number;
  change24h: number; // percentage
  marketCap?: number;
  volume24h?: number;
  logoUrl?: string; // URL for logo
  dataAiHint?: string; // For Unsplash search keywords
  icon?: LucideIcon | string; // Optional: Lucide icon or character for fallback

  // Stock specific detailed metrics
  peRatio?: number; // P/E
  epsDilutedTTM?: number; // EPS dil TTM ($)
  epsDilutedGrowthTTMYoY?: number; // EPS dil growth TTM YoY (%)
  dividendYieldTTM?: number; // Div yield % TTM (%)
  sector?: string; // Sector
  relativeVolume?: number; // Rel Volume (e.g., 1.5 means 1.5x average volume)

  // Crypto specific metrics
  circulatingSupply?: string; // Example: "19.7M BTC"
  allTimeHigh?: string; // Example: "$69,044.77"
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
}
