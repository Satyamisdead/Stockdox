
"use client";

import { getAssetById, placeholderNews } from "@/lib/placeholder-data";
import type { Asset, NewsArticle } from "@/types";
import Image from "next/image";
import PriceDisplay from "@/components/market/PriceDisplay";
import AssetChart from "@/components/market/AssetChart";
import NewsItem from "@/components/market/NewsItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const asset: Asset | undefined = getAssetById(params.id);
  const news: NewsArticle[] = placeholderNews; // Mock news

  if (!asset) {
    notFound();
  }

  const IconComponent = asset.icon;

  // Placeholder for financial metrics. In a real app, an LLM might decide which ones to show.
  // For example, by calling a flow: const metricsToShow = await ai.getFinancialMetricsForAsset(asset.id);
  const financialMetrics = [
    { label: "Market Cap", value: asset.marketCap ? `$${asset.marketCap.toLocaleString()}` : "N/A" },
    { label: "Volume (24h)", value: asset.volume24h ? `$${asset.volume24h.toLocaleString()}` : "N/A" },
    { label: "Asset Type", value: asset.type === 'stock' ? 'Stock' : 'Cryptocurrency' },
    // Add more common metrics or metrics determined by LLM.
    { label: "Circulating Supply", value: asset.type === 'crypto' ? "19.7M BTC (Example)" : "N/A" },
    { label: "All-Time High", value: "$69,044.77 (Example)" },
  ];

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Assets
      </Button>

      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           {asset.logoUrl ? (
            <Image 
              src={asset.logoUrl} 
              alt={`${asset.name} logo`} 
              width={60} 
              height={60} 
              className="rounded-full shadow-lg"
              data-ai-hint={asset.dataAiHint || asset.name.toLowerCase()}
            />
          ) : IconComponent && typeof IconComponent !== 'string' ? (
            <IconComponent className="h-16 w-16 text-primary" />
          ) : (
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-primary">
              {typeof IconComponent === 'string' ? IconComponent : asset.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{asset.name}</h1>
            <p className="text-lg text-muted-foreground">{asset.symbol}</p>
          </div>
        </div>
        <PriceDisplay price={asset.price} change={asset.change24h} symbol={asset.symbol} />
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
                <div key={metric.label} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{metric.label}:</span>
                  <span className="font-medium text-foreground">{metric.value}</span>
                </div>
              ))}
               <div className="pt-2 text-xs text-muted-foreground/70 flex items-start gap-1.5">
                <Info size={14} className="mt-0.5 shrink-0"/> 
                <span>Some metrics might be decided by an AI model based on asset type and availability. Displaying common examples.</span>
              </div>
            </CardContent>
          </Card>
           <Badge variant="outline">{asset.type === 'stock' ? 'US Stock Market' : 'Global Crypto Market'}</Badge>
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold font-headline">Related News</h2>
        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article) => (
              <NewsItem key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent news available for {asset.name}.</p>
        )}
      </section>
    </div>
  );
}
