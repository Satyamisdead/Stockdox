
"use client";

import { useMemo, useEffect, useState } from "react";
import { placeholderNews, getAssetById as getPlaceholderAssetById } from "@/lib/placeholder-data"; // Keep for news and initial structure
import type { Asset, NewsArticle, FinnhubQuote, FinnhubProfile } from "@/types";
import Image from "next/image";
import PriceDisplay from "@/components/market/PriceDisplay";
import AssetChart from "@/components/market/AssetChart";
import NewsItem from "@/components/market/NewsItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, DollarSign, Bitcoin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";
import Loading from "@/app/loading"; // Import loading component

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null | undefined>(undefined); // undefined for loading, null for not found
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const assetId = params.id;
    if (!assetId) {
      notFound();
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      const placeholderAsset = getPlaceholderAssetById(assetId); // Get type from placeholder
      
      if (!placeholderAsset) {
        setAsset(null); // Mark as not found
        setIsLoading(false);
        return;
      }

      const profile = await fetchProfileBySymbol(placeholderAsset.symbol, placeholderAsset.type);
      const quote = await fetchQuoteBySymbol(placeholderAsset.symbol);

      if (profile && quote && quote.c !== undefined) {
        const fetchedAssetData: Asset = {
          id: placeholderAsset.id,
          symbol: placeholderAsset.symbol.toUpperCase(),
          name: profile.name || placeholderAsset.name,
          type: placeholderAsset.type,
          price: quote.c,
          change24h: quote.dp,
          dailyChange: quote.d,
          dailyHigh: quote.h,
          dailyLow: quote.l,
          dailyOpen: quote.o,
          previousClose: quote.pc,
          marketCap: profile.marketCapitalization,
          logoUrl: profile.logo || placeholderAsset.logoUrl,
          sector: profile.finnhubIndustry || placeholderAsset.sector,
          exchange: profile.exchange,
          // Retain other details from placeholder if not directly available from these Finnhub calls
          volume24h: placeholderAsset.volume24h,
          peRatio: placeholderAsset.peRatio,
          epsDilutedTTM: placeholderAsset.epsDilutedTTM,
          epsDilutedGrowthTTMYoY: placeholderAsset.epsDilutedGrowthTTMYoY,
          dividendYieldTTM: placeholderAsset.dividendYieldTTM,
          circulatingSupply: placeholderAsset.circulatingSupply,
          allTimeHigh: placeholderAsset.allTimeHigh,
          relativeVolume: placeholderAsset.relativeVolume,
          icon: placeholderAsset.icon,
          dataAiHint: profile.logo ? undefined : placeholderAsset.dataAiHint,
        };
        setAsset(fetchedAssetData);
      } else {
        // Fallback to placeholder if API fetch fails, or show limited data
        console.warn(`Could not fetch full Finnhub data for ${placeholderAsset.symbol}. Using placeholder data.`);
        setAsset(placeholderAsset); // Use the placeholder data as a fallback
      }
      setIsLoading(false);
    };

    fetchData();
  }, [params.id]);


  const relatedNews = useMemo(() => {
    if (!asset) return [];
    const searchTerm = asset.name.toLowerCase();
    const symbolTerm = asset.symbol.toLowerCase();
    
    const filtered = placeholderNews.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.title.toLowerCase().includes(symbolTerm) ||
      (article.summary && (article.summary.toLowerCase().includes(searchTerm) || article.summary.toLowerCase().includes(symbolTerm)))
    );
    
    if (filtered.length > 0) return filtered.slice(0,3);
    return placeholderNews.slice(0, 3);
  }, [asset]);


  if (isLoading) {
    return <Loading />;
  }

  if (asset === null) { // Explicitly checking for null which we set for "not found"
    notFound();
  }
  
  if (!asset) { // Fallback if asset is still undefined for some reason (should be caught by isLoading or null check)
      return <Loading />; // Or a more specific error
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
        if (asset.symbol === 'BTC' || asset.symbol === 'ETH') pricePrecision = 8;
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
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
          <AssetChart assetName={asset.name} />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Key Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {financialMetrics.map((metric) => (
                metric.value !== "N/A" && metric.value !== undefined && metric.value !== null ? (
                  <div key={metric.label} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{metric.label}:</span>
                    <span className="font-medium text-foreground">{metric.value}</span>
                  </div>
                ) : null
              ))}
               <div className="pt-2 text-xs text-muted-foreground/70 flex items-start gap-1.5">
                <Info size={14} className="mt-0.5 shrink-0"/> 
                <span>Financial data is sourced from Finnhub & placeholders. Values may not be fully comprehensive for all assets.</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

