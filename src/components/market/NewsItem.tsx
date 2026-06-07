
import type { NewsArticle } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";

type NewsItemProps = {
  article: NewsArticle;
  assetId: string; // To help construct the link to the news reader
};

export default function NewsItem({ article, assetId }: NewsItemProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
        <CardDescription>
          {article.source} - {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      {article.summary && (
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.summary}
          </p>
        </CardContent>
      )}
      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/news-reader/${assetId}/${encodeURIComponent(article.id)}`} className="gap-2">
            Read More <BookOpen className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
