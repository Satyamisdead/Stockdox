
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Asset, NewsArticle } from "@/types";
import { fetchNewsForAsset } from "@/services/marketauxService";
import AssetChart from "@/components/market/AssetChart";
import NewsItem from "@/components/market/NewsItem";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bitcoin, Briefcase, DollarSign } from "lucide-react";
import AssetLiveDataProvider from "./AssetLiveDataProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "../ui/card";


interface AssetDetailContentProps {
  initialAsset: Asset;
}

export default function AssetDetailContent({ initialAsset }: AssetDetailContentProps) {
  const router = useRouter();
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  useEffect(() => {
    const getNews = async () => {
      setIsLoadingNews(true);
      try {
        const news = await fetchNewsForAsset(initialAsset.symbol);
        setRelatedNews(news);
      } catch (error) {
        console.error(`Failed to fetch news for ${initialAsset.symbol}`, error);
        setRelatedNews([]); // Set to empty on error
      } finally {
        setIsLoadingNews(false);
      }
    };

    getNews();
  }, [initialAsset.symbol]);

  const FallbackIcon = initialAsset.type === 'stock' ? Briefcase : initialAsset.type === 'crypto' ? Bitcoin : DollarSign;
  let IconComponent;
  if (initialAsset.icon && typeof initialAsset.icon !== 'string') {
    IconComponent = initialAsset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  const NewsSkeleton = () => (
    <Card className="flex flex-col h-full shadow-lg">
        <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-4 w-1/3" />
            <div className="pt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
             <div className="pt-4">
                 <Skeleton className="h-9 w-28" />
             </div>
        </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Button variant="outline" onClick={() => router.push('/')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <AssetChart 
            symbol={initialAsset.symbol} 
            assetType={initialAsset.type} 
            exchange={initialAsset.exchange} 
            name={initialAsset.name} 
          />
        </div>
        <div className="space-y-4">
            <AssetLiveDataProvider initialAsset={initialAsset} />
        </div>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold font-headline">Related News for {initialAsset.name}</h2>
        
        {isLoadingNews && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <NewsSkeleton key={i} />)}
          </div>
        )}

        {!isLoadingNews && relatedNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {relatedNews.map((article) => (
              <NewsItem key={article.id} article={article} assetId={initialAsset.id} />
            ))}
          </div>
        ) : !isLoadingNews && (
          <p className="text-muted-foreground py-8 text-center bg-card rounded-lg">No recent news found for {initialAsset.name}.</p>
        )}
      </section>
    </div>
  );
}
