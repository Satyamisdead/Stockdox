import type { Asset } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PriceDisplay from "./PriceDisplay";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react"; // Placeholder for add to watchlist

type AssetCardProps = {
  asset: Asset;
};

export default function AssetCard({ asset }: AssetCardProps) {
  const IconComponent = asset.icon;

  return (
    <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {asset.logoUrl ? (
            <Image 
              src={asset.logoUrl} 
              alt={`${asset.name} logo`} 
              width={40} 
              height={40} 
              className="rounded-full"
              data-ai-hint={asset.dataAiHint || asset.name.toLowerCase()}
            />
          ) : IconComponent && typeof IconComponent !== 'string' ? (
            <IconComponent className="h-10 w-10 text-primary" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-primary">
              {typeof IconComponent === 'string' ? IconComponent : asset.symbol.charAt(0)}
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-medium font-headline">{asset.name}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{asset.symbol} - {asset.type === 'stock' ? 'Stock' : 'Crypto'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PriceDisplay price={asset.price} change={asset.change24h} symbol={asset.symbol} />
        <div className="mt-4 flex justify-between items-center">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/asset/${asset.id}`}>View Details</Link>
          </Button>
          {/* Placeholder for Add to Watchlist */}
          <Button variant="ghost" size="icon" title="Add to Watchlist">
            <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
