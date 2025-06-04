
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { getAssetById, getNewsArticleById } from '@/lib/placeholder-data';
import type { Asset, NewsArticle } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import Loading from '@/app/loading';

export default function NewsReaderPage() {
  const router = useRouter();
  const params = useParams();
  
  const assetId = Array.isArray(params.assetId) ? params.assetId[0] : params.assetId;
  const articleId = Array.isArray(params.articleId) ? params.articleId[0] : params.articleId;

  const [asset, setAsset] = useState<Asset | null | undefined>(undefined);
  const [article, setArticle] = useState<NewsArticle | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (assetId && articleId) {
      const decodedArticleId = decodeURIComponent(articleId);
      const foundAsset = getAssetById(assetId);
      const foundArticle = getNewsArticleById(decodedArticleId);
      
      setAsset(foundAsset);
      setArticle(foundArticle);
      setIsLoading(false);
    } else {
      setIsLoading(false); // Mark loading as false if params are missing
    }
  }, [assetId, articleId]);

  if (isLoading) {
    return <Loading />;
  }

  if (!asset || !article) {
    // Use Next.js notFound to render the nearest not-found.js page
    // This is more appropriate than a custom message here for missing core data.
    notFound();
    return null; // Keep TypeScript happy, notFound() will throw an error.
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.push(`/asset/${asset.id}`)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {asset.name}
      </Button>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline leading-tight">{article.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            By {article.source} &bull; Published on {format(new Date(article.publishedAt), "MMMM d, yyyy 'at' h:mm a")}
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className="py-6">
          {article.summary ? (
            <p className="text-base leading-relaxed text-foreground whitespace-pre-line">
              {article.summary}
            </p>
          ) : (
            <p className="text-muted-foreground">Full article content not available in this view.</p>
          )}
        </CardContent>
        <Separator />
        <CardFooter className="pt-6">
          <Button asChild variant="default">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
              View Full Article on {article.source} <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

