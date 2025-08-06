
"use client";

import type { NewsArticle } from "@/types";
import { globalNewsData } from "@/lib/global-news-data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Newspaper } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Loading from "../loading";

// Simple News Item Renderer for this page
function GlobalNewsItem({ article }: { article: NewsArticle }) {
  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
      <CardHeader>
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

export default function GlobalNewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin?redirect=/news');
    }
  }, [user, authLoading, router]);

  const newsArticles: NewsArticle[] = globalNewsData;
  
  if (authLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Newspaper className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary font-headline">Market News</h1>
      </div>
      
      {newsArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsArticles.map((article) => (
            <GlobalNewsItem key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No news articles available at the moment.</p>
        </div>
      )}
    </div>
  );
}
