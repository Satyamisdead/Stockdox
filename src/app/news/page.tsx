
"use client";

import { useEffect, useState } from "react";
import type { NewsArticle } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Newspaper, WifiOff } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fetchLatestNews } from "@/services/marketauxService";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

function GlobalNewsItem({ article }: { article: NewsArticle }) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
        <div className="aspect-video relative mb-4">
            <Image 
                src={article.imageUrl || `https://placehold.co/600x400.png?text=${encodeURIComponent(article.source)}`}
                alt={article.title}
                layout="fill"
                objectFit="cover"
                className="rounded-t-lg border-b"
                data-ai-hint="news article"
            />
        </div>
        <CardTitle className="text-lg font-headline leading-tight">{article.title}</CardTitle>
        <CardDescription className="text-xs">
          {article.source} - {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      {article.summary && (
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-4">
            {article.summary}
          </p>
        </CardContent>
      )}
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
            Read Full Article <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

function NewsSkeleton() {
    return (
        <Card className="flex flex-col h-full shadow-lg">
            <CardHeader>
                <Skeleton className="aspect-video w-full mb-4" />
                <Skeleton className="h-6 w-5/6 mb-2" />
                <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-9 w-32" />
            </CardFooter>
        </Card>
    )
}

export default function GlobalNewsPage() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getNews = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const articles = await fetchLatestNews();
            setNewsArticles(articles);
        } catch (err) {
            setError("Failed to fetch news. Please check your connection and API key.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    getNews();
  }, []);
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Newspaper className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary font-headline">Market News</h1>
      </div>
      
      {isLoading && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, index) => (
                <NewsSkeleton key={index} />
            ))}
        </div>
      )}

      {!isLoading && error && (
          <div className="text-center py-12 bg-card rounded-lg flex flex-col items-center justify-center">
            <WifiOff className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">An Error Occurred</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
          </div>
      )}

      {!isLoading && !error && newsArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.map((article) => (
            <GlobalNewsItem key={article.id} article={article} />
          ))}
        </div>
      ) : !isLoading && !error && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No news articles available at the moment.</p>
        </div>
      )}
    </div>
  );
}
