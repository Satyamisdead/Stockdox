
"use client";

import { useEffect, useState } from "react";
import type { Asset } from "@/types";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";
import Image from "next/image";
import PriceDisplay from "@/components/market/PriceDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bitcoin, Briefcase, DollarSign, RefreshCw, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AssetLiveDataProviderProps {
  initialAsset: Asset;
}

export default function AssetLiveDataProvider({ initialAsset }: AssetLiveDataProviderProps) {
  const [liveAsset, setLiveAsset] = useState<Asset>(initialAsset);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchLiveData = async () => {
      setIsFetching(true);
      try {
        const [quoteData, profileData] = await Promise.all([
          fetchQuoteBySymbol(initialAsset.symbol),
          fetchProfileBySymbol(initialAsset.symbol, initialAsset.type)
        ]);
        
        setLiveAsset(prevAsset => ({
          ...prevAsset,
          price: quoteData?.c ?? prevAsset.price,
          change24h: quoteData?.dp ?? prevAsset.change24h,
          dailyChange: quoteData?.d ?? prevAsset.dailyChange,
          dailyHigh: quoteData?.h ?? prevAsset.dailyHigh,
          dailyLow: quoteData?.l ?? prevAsset.dailyLow,
          dailyOpen: quoteData?.o ?? prevAsset.dailyOpen,
          previousClose: quoteData?.pc ?? prevAsset.previousClose,
          marketCap: profileData?.marketCapitalization ? profileData.marketCapitalization * 1e6 : prevAsset.marketCap,
          sector: profileData?.finnhubIndustry || prevAsset.sector,
          logoUrl: profileData?.logo || prevAsset.logoUrl,
        }));

      } catch (error) {
        console.error(`Failed to fetch live data for ${initialAsset.symbol}`, error);
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchLiveData();
  }, [initialAsset.symbol, initialAsset.type]);

  const FallbackIcon = liveAsset.type === 'stock' ? Briefcase : liveAsset.type === 'crypto' ? Bitcoin : DollarSign;
  let IconComponent;
  if (liveAsset.icon && typeof liveAsset.icon !== 'string') {
    IconComponent = liveAsset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  let financialMetrics: { label: string; value: string | number | null | undefined }[] = [];
  if (liveAsset.type === 'stock') {
    financialMetrics = [
      { label: "Price", value: liveAsset.price !== undefined ? `$${liveAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A" },
      { label: "Change % (24h)", value: liveAsset.change24h !== undefined && liveAsset.change24h !== null ? `${liveAsset.change24h.toFixed(2)}%` : "N/A" },
      { label: "Daily Change", value: liveAsset.dailyChange !== undefined && liveAsset.dailyChange !== null ? `$${liveAsset.dailyChange.toFixed(2)}` : "N/A" },
      { label: "Day High", value: liveAsset.dailyHigh !== undefined ? `$${liveAsset.dailyHigh.toFixed(2)}` : "N/A" },
      { label: "Day Low", value: liveAsset.dailyLow !== undefined ? `$${liveAsset.dailyLow.toFixed(2)}` : "N/A" },
      { label: "Open", value: liveAsset.dailyOpen !== undefined ? `$${liveAsset.dailyOpen.toFixed(2)}` : "N/A" },
      { label: "Prev. Close", value: liveAsset.previousClose !== undefined ? `$${liveAsset.previousClose.toFixed(2)}` : "N/A" },
      { label: "Volume (24h)", value: liveAsset.volume24h ? liveAsset.volume24h.toLocaleString() : "N/A" },
      { label: "Market Cap", value: liveAsset.marketCap ? `$${liveAsset.marketCap.toLocaleString()}` : "N/A" },
      { label: "Sector", value: liveAsset.sector || "N/A" },
      { label: "Exchange", value: liveAsset.exchange || "N/A" },
    ];
  } else { // crypto
    let pricePrecision = liveAsset.price && liveAsset.price < 1 ? (liveAsset.price < 0.01 ? 6 : 4) : 2;
    financialMetrics = [
       { label: "Price", value: liveAsset.price !== undefined ? `$${liveAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pricePrecision })}` : "N/A" },
      { label: "Change % (24h)", value: liveAsset.change24h !== undefined && liveAsset.change24h !== null ? `${liveAsset.change24h.toFixed(2)}%` : "N/A" },
      { label: "Daily Change", value: liveAsset.dailyChange !== undefined && liveAsset.dailyChange !== null ? `$${liveAsset.dailyChange.toFixed(pricePrecision)}` : "N/A" },
      { label: "Day High", value: liveAsset.dailyHigh !== undefined ? `$${liveAsset.dailyHigh.toFixed(pricePrecision)}` : "N/A" },
      { label: "Day Low", value: liveAsset.dailyLow !== undefined ? `$${liveAsset.dailyLow.toFixed(pricePrecision)}` : "N/A" },
      { label: "Open", value: liveAsset.dailyOpen !== undefined ? `$${liveAsset.dailyOpen.toFixed(pricePrecision)}` : "N/A" },
      { label: "Prev. Close", value: liveAsset.previousClose !== undefined ? `$${liveAsset.previousClose.toFixed(pricePrecision)}` : "N/A" },
      { label: "Volume (24h)", value: liveAsset.volume24h ? `$${liveAsset.volume24h.toLocaleString()}` : "N/A" },
      { label: "Market Cap", value: liveAsset.marketCap ? `$${liveAsset.marketCap.toLocaleString()}` : "N/A" },
      { label: "Circulating Supply", value: liveAsset.circulatingSupply || "N/A" },
    ];
  }

  return (
    <>
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Image 
            src={liveAsset.logoUrl || 'https://placehold.co/60x60.png'} 
            alt={`${liveAsset.name} logo`} 
            width={60} 
            height={60} 
            className="rounded-full shadow-lg"
            data-ai-hint={liveAsset.dataAiHint || liveAsset.name.toLowerCase().split(" ")[0]}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/60x60.png'; }}
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{liveAsset.name}</h1>
              {isFetching && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse mt-1">
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Syncing live data...</span>
                </div>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{liveAsset.symbol}</p>
          </div>
        </div>
        {isFetching ? (
          <Skeleton className="h-12 w-48" />
        ) : (
          <PriceDisplay price={liveAsset.price!} change={liveAsset.change24h!} symbol={liveAsset.symbol} />
        )}
      </section>
      
      <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Key Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                {isFetching ? (
                    Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                    ))
                ) : (
                    financialMetrics.map((metric) => (
                    metric.value !== "N/A" && metric.value !== undefined && metric.value !== null ? (
                        <div key={metric.label} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{metric.label}:</span>
                        <span className="font-medium text-foreground">{String(metric.value)}</span>
                        </div>
                    ) : null
                    ))
                )}
                <div className="pt-2 text-xs text-muted-foreground/70 flex items-start gap-1.5">
                    <Info size={14} className="mt-0.5 shrink-0"/> 
                    <span>Financial data is sourced from Finnhub. Chart by TradingView.</span>
                </div>
                </CardContent>
            </Card>
            <Badge variant="outline">{liveAsset.type === 'stock' ? 'Stock Market' : 'Cryptocurrency Market'}</Badge>
      </div>
    </>
  );
}
