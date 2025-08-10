
"use client";

import { useMemo, useEffect, useState }from "react";
import { useParams, notFound, useRouter } from "next/navigation"; 
import type { Asset, NewsArticle } from "@/types";
import { getAssetById, placeholderNews } from "@/lib/placeholder-data";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";
import Image from "next/image";
import Link from "next/link";
import PriceDisplay from "@/components/market/PriceDisplay";
import AssetChart from "@/components/market/AssetChart";
import NewsItem from "@/components/market/NewsItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, DollarSign, Bitcoin, Briefcase, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Loading from "@/app/loading"; 
import { Skeleton } from "@/components/ui/skeleton";

export default function AssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [asset, setAsset] = useState<Asset | null | undefined>(() => getAssetById(assetId));
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingLiveData, setIsFetchingLiveData] = useState(false);

  // Effect to handle initial load and live data fetching
  useEffect(() => {
    if (!assetId) {
      setIsLoading(false);
      notFound();
      return;
    }

    // Initial state is set from placeholder data for speed.
    const initialAsset = getAssetById(assetId);
    if (!initialAsset) {
        setIsLoading(false);
        notFound();
        return;
    }
    setAsset(initialAsset);
    setIsLoading(false); // Stop initial loading, page is now interactive

    // Fetch live data in the background
    const fetchLiveData = async () => {
      setIsFetchingLiveData(true);
      try {
        const [quoteData, profileData] = await Promise.all([
          fetchQuoteBySymbol(initialAsset.symbol),
          fetchProfileBySymbol(initialAsset.symbol, initialAsset.type)
        ]);

        if (quoteData) {
          setAsset(prevAsset => ({
            ...(prevAsset || initialAsset), // Use previous state or initial as base
            price: quoteData.c,
            change24h: quoteData.dp,
            dailyChange: quoteData.d,
            dailyHigh: quoteData.h,
            dailyLow: quoteData.l,
            dailyOpen: quoteData.o,
            previousClose: quoteData.pc,
            marketCap: profileData?.marketCapitalization ? profileData.marketCapitalization * 1e6 : prevAsset?.marketCap,
            sector: profileData?.finnhubIndustry || prevAsset?.sector,
          }));
        }
      } catch (error) {
        console.error(`Failed to fetch live data for ${initialAsset.symbol}`, error);
        // Silently fail, leaving placeholder data in place.
      } finally {
        setIsFetchingLiveData(false);
      }
    };
    
    fetchLiveData();

  }, [assetId]);

  const relatedNews = useMemo(() => {
    if (!asset) return [];
    const searchTerm = asset.name.toLowerCase();
    const symbolTerm = asset.symbol.toLowerCase();
    
    const filtered = placeholderNews.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.title.toLowerCase().includes(symbolTerm) ||
      (article.summary && (article.summary.toLowerCase().includes(searchTerm) || article.summary.toLowerCase().includes(symbolTerm)))
    );
    
    if (filtered.length > 0) return filtered.slice(0, 8);
    return placeholderNews.slice(0, 8);
  }, [asset]);


  if (isLoading) {
    return <Loading />;
  }
  
  if (!asset) { 
    notFound();
    return null;
  }

  const FallbackIcon = asset.type === 'stock' ? Briefcase : asset.type === 'crypto' ? Bitcoin : DollarSign;
  let IconComponent;
  if (asset.icon && typeof asset.icon !== 'string') {
    IconComponent = asset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  let financialMetrics: { label: string; value: string | number | null | undefined }[] = [];

  if (asset.type === 'stock') {
    financialMetrics = [
      { label: "Price", value: asset.price !== undefined ? `$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "N/A" },
      { label: "Change % (24h)", value: asset.change24h !== undefined && asset.change24h !== null ? `${asset.change24h.toFixed(2)}%` : "N/A" },
      { label: "Daily Change", value: asset.dailyChange !== undefined && asset.dailyChange !== null ? `$${asset.dailyChange.toFixed(2)}` : "N/A" },
      { label: "Day High", value: asset.dailyHigh !== undefined ? `$${asset.dailyHigh.toFixed(2)}` : "N/A" },
      { label: "Day Low", value: asset.dailyLow !== undefined ? `$${asset.dailyLow.toFixed(2)}` : "N/A" },
      { label: "Open", value: asset.dailyOpen !== undefined ? `$${asset.dailyOpen.toFixed(2)}` : "N/A" },
      { label: "Prev. Close", value: asset.previousClose !== undefined ? `$${asset.previousClose.toFixed(2)}` : "N/A" },
      { label: "Volume (24h)", value: asset.volume24h ? asset.volume24h.toLocaleString() : "N/A" },
      { label: "Rel Volume", value: asset.relativeVolume ? `${asset.relativeVolume.toFixed(1)}x` : "N/A" },
      { label: "Market Cap", value: asset.marketCap ? `$${asset.marketCap.toLocaleString()}` : "N/A" },
      { label: "P/E Ratio", value: asset.peRatio ? asset.peRatio.toFixed(2) : "N/A" },
      { label: "EPS (TTM)", value: asset.epsDilutedTTM ? `$${asset.epsDilutedTTM.toFixed(2)}` : "N/A" },
      { label: "Div Yield (TTM)", value: asset.dividendYieldTTM ? `${asset.dividendYieldTTM.toFixed(2)}%` : "N/A" },
      { label: "Sector", value: asset.sector || "N/A" },
      { label: "Exchange", value: asset.exchange || "N/A" },
    ];
  } else if (asset.type === 'crypto') {
     let pricePrecision = 2;
     if (asset.price !== undefined) {
        if (asset.symbol === 'BTC' || asset.symbol === 'ETH') pricePrecision = 2;
        else if (asset.price < 0.01) pricePrecision = 6;
        else if (asset.price < 1) pricePrecision = 4;
     }
    financialMetrics = [
      { label: "Price", value: asset.price !== undefined ? `$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: pricePrecision })}` : "N/A" },
      { label: "Change % (24h)", value: asset.change24h !== undefined && asset.change24h !== null ? `${asset.change24h.toFixed(2)}%` : "N/A" },
      { label: "Daily Change", value: asset.dailyChange !== undefined && asset.dailyChange !== null ? `$${asset.dailyChange.toFixed(pricePrecision)}` : "N/A" },
      { label: "Day High", value: asset.dailyHigh !== undefined ? `$${asset.dailyHigh.toFixed(pricePrecision)}` : "N/A" },
      { label: "Day Low", value: asset.dailyLow !== undefined ? `$${asset.dailyLow.toFixed(pricePrecision)}` : "N/A" },
      { label: "Open", value: asset.dailyOpen !== undefined ? `$${asset.dailyOpen.toFixed(pricePrecision)}` : "N/A" },
      { label: "Prev. Close", value: asset.previousClose !== undefined ? `$${asset.previousClose.toFixed(pricePrecision)}` : "N/A" },
      { label: "Volume (24h)", value: asset.volume24h ? `$${asset.volume24h.toLocaleString()}` : "N/A" },
      { label: "Market Cap", value: asset.marketCap ? `$${asset.marketCap.toLocaleString()}` : "N/A" },
      { label: "Circulating Supply", value: asset.circulatingSupply || "N/A" },
      { label: "All-Time High", value: asset.allTimeHigh || "N/A" },
      { label: "Asset Type", value: "Cryptocurrency" },
      { label: "Exchange", value: asset.exchange || "N/A" },
    ];
  }


  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           {asset.logoUrl && asset.logoUrl !== 'https://placehold.co/40x40.png' ? (
            <Image 
              src={asset.logoUrl} 
              alt={`${asset.name} logo`} 
              width={60} 
              height={60} 
              className="rounded-full shadow-lg"
              data-ai-hint={asset.dataAiHint || asset.name.toLowerCase().split(" ")[0]}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/60x60.png'; (e.target as HTMLImageElement).dataset.aiHint = 'default logo'; }}
            />
          ) : typeof asset.icon === 'string' && asset.icon.length === 1 ? (
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">
              {asset.icon}
            </div>
          ) : (
            <IconComponent className="h-16 w-16 text-primary" />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{asset.name}</h1>
            <p className="text-lg text-muted-foreground">{asset.symbol}</p>
          </div>
        </div>
        {asset.price !== undefined && asset.change24h !== undefined && asset.change24h !== null ? (
            <PriceDisplay price={asset.price} change={asset.change24h} symbol={asset.symbol} />
        ) : <Skeleton className="h-12 w-32" /> }
      </section>

      <Separator />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <AssetChart 
            symbol={asset.symbol} 
            assetType={asset.type} 
            exchange={asset.exchange} 
            name={asset.name} 
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">Key Statistics</CardTitle>
                 {isFetchingLiveData && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Syncing live data...</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialMetrics.map((metric) => (
                metric.value !== "N/A" && metric.value !== undefined && metric.value !== null ? (
                  <div key={metric.label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{metric.label}:</span>
                    <span className="font-medium text-foreground">{String(metric.value)}</span>
                  </div>
                ) : null
              ))}
               <div className="pt-2 text-xs text-muted-foreground/70 flex items-start gap-1.5">
                <Info size={14} className="mt-0.5 shrink-0"/> 
                <span>Financial data is sourced from placeholders & Finnhub. Chart by TradingView.</span>
              </div>
            </CardContent>
          </Card>
           <Badge variant="outline">{asset.type === 'stock' ? 'Stock Market' : 'Cryptocurrency Market'}</Badge>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold font-headline">Related News for {asset.name}</h2>
        {relatedNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedNews.map((article) => (
              <NewsItem key={article.id} article={article} assetId={asset.id} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No specific news found for {asset.name}. Displaying general market news.</p>
        )}
      </section>
    </div>
  );
}
