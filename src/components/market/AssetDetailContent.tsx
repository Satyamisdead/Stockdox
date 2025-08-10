
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Asset } from "@/types";
import { placeholderNews } from "@/lib/placeholder-data";
import Image from "next/image";
import AssetChart from "@/components/market/AssetChart";
import NewsItem from "@/components/market/NewsItem";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bitcoin, Briefcase, DollarSign } from "lucide-react";
import AssetLiveDataProvider from "./AssetLiveDataProvider";

interface AssetDetailContentProps {
  initialAsset: Asset;
}

export default function AssetDetailContent({ initialAsset }: AssetDetailContentProps) {
  const router = useRouter();

  const relatedNews = useMemo(() => {
    const searchTerm = initialAsset.name.toLowerCase();
    const symbolTerm = initialAsset.symbol.toLowerCase();
    
    const filtered = placeholderNews.filter(article => 
      article.title.toLowerCase().includes(searchTerm) ||
      article.title.toLowerCase().includes(symbolTerm) ||
      (article.summary && (article.summary.toLowerCase().includes(searchTerm) || article.summary.toLowerCase().includes(symbolTerm)))
    );
    
    if (filtered.length > 0) return filtered.slice(0, 8);
    return placeholderNews.slice(0, 8);
  }, [initialAsset]);

  const FallbackIcon = initialAsset.type === 'stock' ? Briefcase : initialAsset.type === 'crypto' ? Bitcoin : DollarSign;
  let IconComponent;
  if (initialAsset.icon && typeof initialAsset.icon !== 'string') {
    IconComponent = initialAsset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* This component will now handle all live data fetching and display */}
      <AssetLiveDataProvider initialAsset={initialAsset} />

      <Separator />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <AssetChart 
            symbol={initialAsset.symbol} 
            assetType={initialAsset.type} 
            exchange={initialAsset.exchange} 
            name={initialAsset.name} 
          />
        </div>
        <div className="space-y-4">
            {/* The live stats are now inside AssetLiveDataProvider, but we render the provider at the top level. The provider itself will have the stats card. So we leave this div empty or for other content.*/}
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold font-headline">Related News for {initialAsset.name}</h2>
        {relatedNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedNews.map((article) => (
              <NewsItem key={article.id} article={article} assetId={initialAsset.id} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No specific news found for {initialAsset.name}. Displaying general market news.</p>
        )}
      </section>
    </div>
  );
}
