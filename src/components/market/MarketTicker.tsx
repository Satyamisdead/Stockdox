
"use client";

import { useEffect, useState } from 'react';
import type { Asset } from '@/types';
import { placeholderAssets } from '@/lib/placeholder-data';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TickerItem = ({ asset }: { asset: Asset }) => {
  const isPositive = asset.change24h !== undefined && asset.change24h !== null && asset.change24h >= 0;
  const isNegative = asset.change24h !== undefined && asset.change24h !== null && asset.change24h < 0;

  return (
    <div className="flex items-center shrink-0 mx-4">
      <span className="font-semibold text-sm text-foreground">{asset.symbol.toUpperCase()}</span>
      <div className={cn(
        "flex items-center text-sm font-medium ml-2",
        isPositive && "text-green-500",
        isNegative && "text-red-500"
      )}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>
            {asset.change24h !== undefined && asset.change24h !== null 
                ? `${asset.change24h.toFixed(2)}%` 
                : '0.00%'}
        </span>
      </div>
    </div>
  );
};

export default function MarketTicker() {
  const [tickerAssets, setTickerAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Select a mix of assets for the ticker
    const selectedAssets = [
        ...placeholderAssets.filter(a => a.type === 'crypto').slice(0, 5),
        ...placeholderAssets.filter(a => a.type === 'stock').slice(0, 5),
    ];
    setTickerAssets(selectedAssets);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
        <div className="w-full h-10 bg-card border-b overflow-hidden flex items-center">
            <Skeleton className="h-6 w-full" />
        </div>
    );
  }

  return (
    <div className="w-full h-10 bg-card border-b overflow-hidden relative group">
      <div className="flex animate-marquee group-hover:pause">
        {tickerAssets.map((asset) => (
          <TickerItem key={`ticker-1-${asset.id}`} asset={asset} />
        ))}
      </div>
      <div className="absolute top-0 flex animate-marquee2 group-hover:pause">
         {tickerAssets.map((asset) => (
          <TickerItem key={`ticker-2-${asset.id}`} asset={asset} />
        ))}
      </div>
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-card via-transparent to-card pointer-events-none" />
    </div>
  );
}
