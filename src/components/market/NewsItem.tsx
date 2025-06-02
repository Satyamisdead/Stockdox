import type { NewsArticle } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';


type NewsItemProps = {
  article: NewsArticle;
};

export default function NewsItem({ article }: NewsItemProps) {
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
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="gap-2">
            Read More <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
