
"use client";

import type { Asset } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PriceDisplay from "./PriceDisplay";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2, DollarSign, Bitcoin, Briefcase, BellOff } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getWatchlistAssetIds, toggleWatchlistAsset } from "@/services/userPreferenceService";
import { Skeleton } from "@/components/ui/skeleton";

type AssetCardProps = {
  asset: Asset;
};

export default function AssetCard({ asset }: AssetCardProps) {
  const FallbackIcon = asset.type === 'stock' ? Briefcase : asset.type === 'crypto' ? Bitcoin : DollarSign;
  const { toast } = useToast(); 
  const { user, loading: authLoading } = useAuth();

  const [isOnWatchlist, setIsOnWatchlist] = useState(false);
  const [isWatchlistLoading, setIsWatchlistLoading] = useState(true);

  const checkWatchlistStatus = useCallback(async () => {
    if (typeof window === 'undefined' || authLoading) return;
    if (user) {
      try {
        const watchlistIds = await getWatchlistAssetIds(user.uid);
        setIsOnWatchlist(watchlistIds.includes(asset.id));
      } catch (error) {
        // Error already logged in service
      } finally {
        setIsWatchlistLoading(false);
      }
    } else {
      setIsOnWatchlist(false);
      setIsWatchlistLoading(false);
    }
  }, [user, authLoading, asset.id]);

  useEffect(() => {
    checkWatchlistStatus();
  }, [checkWatchlistStatus]);

  const handleToggleWatchlist = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your watchlist.",
        variant: "default",
      });
      return;
    }

    setIsWatchlistLoading(true);
    try {
      const newStatus = await toggleWatchlistAsset(user.uid, asset.id);
      setIsOnWatchlist(newStatus);
      toast({
        title: newStatus ? "Added to Watchlist" : "Removed from Watchlist",
        description: `${asset.name} has been ${newStatus ? 'added to' : 'removed from'} your watchlist.`,
      });
    } catch (error) {
      toast({
        title: "Error Updating Watchlist",
        description: "Could not update your watchlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsWatchlistLoading(false);
    }
  };

  let IconComponent;
  if (asset.icon && typeof asset.icon !== 'string') {
    IconComponent = asset.icon;
  } else {
    IconComponent = FallbackIcon;
  }

  return (
    <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {asset.logoUrl && asset.logoUrl !== 'https://placehold.co/40x40.png' ? (
            <Image 
              src={asset.logoUrl} 
              alt={`${asset.name} logo`} 
              width={40} 
              height={40} 
              className="rounded-full"
              data-ai-hint={asset.dataAiHint || asset.name.toLowerCase().split(" ")[0]}
              onError={(e) => { 
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/40x40.png'; 
                target.dataset.aiHint = 'default logo';
              }}
            />
          ) : typeof asset.icon === 'string' && asset.icon.length === 1 ? (
             <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-primary">
              {asset.icon}
            </div>
          ) : (
            <IconComponent className="h-10 w-10 text-primary" />
          )}
          <div>
            <CardTitle className="text-lg font-medium font-headline">{asset.name || asset.symbol}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{asset.symbol} - {asset.type === 'stock' ? (asset.sector || 'Stock') : 'Crypto'}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between">
        <div> 
          {asset.price !== undefined && asset.change24h !== undefined && asset.change24h !== null ? (
            <PriceDisplay price={asset.price} change={asset.change24h} symbol={asset.symbol} />
          ) : (
            <div className="space-y-1 mt-1 mb-2">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          )}
          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/asset/${asset.id}`}>View Details</Link>
            </Button>
            <Button variant="ghost" size="icon" title={isOnWatchlist ? "Remove from Watchlist" : "Add to Watchlist"} onClick={handleToggleWatchlist} disabled={isWatchlistLoading}>
              {isWatchlistLoading ? ( 
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellRing className={cn("h-4 w-4", isOnWatchlist ? "text-primary fill-primary/20" : "text-muted-foreground hover:text-primary")} />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
