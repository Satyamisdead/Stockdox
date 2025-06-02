import type { Asset, NewsArticle } from '@/types';
import { DollarSign, TrendingUp, Briefcase, Apple, Search, Zap } from 'lucide-react';

export const placeholderAssets: Asset[] = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    type: 'crypto', 
    price: 60000, 
    change24h: 1.5, 
    marketCap: 1.2e12, 
    volume24h: 30e9, 
    logoUrl: 'https://placehold.co/40x40.png', 
    dataAiHint: 'bitcoin crypto',
    icon: DollarSign // Fallback icon
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    symbol: 'ETH', 
    type: 'crypto', 
    price: 3000, 
    change24h: -0.5, 
    marketCap: 360e9, 
    volume24h: 15e9, 
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'ethereum crypto',
    icon: DollarSign // Fallback icon
  },
  { 
    id: 'sol', 
    name: 'Solana', 
    symbol: 'SOL', 
    type: 'crypto', 
    price: 150, 
    change24h: 3.2, 
    marketCap: 60e9, 
    volume24h: 2e9, 
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'solana crypto',
    icon: Zap
  },
  { 
    id: 'aapl', 
    name: 'Apple Inc.', 
    symbol: 'AAPL', 
    type: 'stock', 
    price: 170, 
    change24h: 0.8, 
    marketCap: 2.8e12, 
    volume24h: 50e6, 
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'apple logo',
    icon: Apple 
  },
  { 
    id: 'msft', 
    name: 'Microsoft Corp.', 
    symbol: 'MSFT', 
    type: 'stock', 
    price: 400, 
    change24h: -0.2, 
    marketCap: 3e12, 
    volume24h: 20e6, 
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'microsoft logo',
    icon: Briefcase 
  },
  { 
    id: 'googl', 
    name: 'Alphabet Inc.', 
    symbol: 'GOOGL', 
    type: 'stock', 
    price: 150, 
    change24h: 1.1, 
    marketCap: 1.9e12, 
    volume24h: 15e6, 
    logoUrl: 'https://placehold.co/40x40.png',
    dataAiHint: 'google logo',
    icon: Search
  },
];

export const placeholderNews: NewsArticle[] = [
  { id: 'news1', title: 'Market Hits Record Highs Amidst Tech Rally', source: 'Finance News Today', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: '#', summary: 'Major indices soared today, largely driven by strong earnings reports from leading technology companies.' },
  { id: 'news2', title: 'Bitcoin Volatility Continues: What Investors Should Know', source: 'Crypto Insights', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '#', summary: 'Bitcoin experienced significant price swings over the past 24 hours, highlighting its inherent volatility.' },
  { id: 'news3', title: 'Federal Reserve Signals Potential Interest Rate Adjustments', source: 'Economic Times', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: '#', summary: 'The Federal Reserve hinted at possible changes to interest rates in the coming months, depending on inflation data.' },
];

export function getAssetById(id: string): Asset | undefined {
  return placeholderAssets.find(asset => asset.id === id);
}
