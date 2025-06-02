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
  logoUrl?: string; // URL for logo from placehold.co
  dataAiHint?: string; // For Unsplash search keywords for placehold.co
  icon?: LucideIcon | string; // Optional: Lucide icon or character for fallback
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
}
