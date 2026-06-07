
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Asset } from "@/types";
import AssetCard from "@/components/market/AssetCard";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loading from "@/app/loading";
import { placeholderAssets } from "@/lib/placeholder-data";

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/watchlist");
    } else {
      // For now, just show some placeholder assets if logged in
      // This will be replaced with actual user watchlist fetching
      if (user) {
        setWatchlistAssets(placeholderAssets.slice(0, 4)); 
      }
      setIsLoadingData(false);
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoadingData) {
     return <Loading />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your watchlist.</p>
        <Button asChild><Link href="/signin?redirect=/watchlist">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary font-headline">Your Watchlist</h1>
      {watchlistAssets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlistAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-lg">
          <EyeOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your watchlist is empty.</h2>
          <p className="text-muted-foreground mb-6">
            Add assets from the dashboard to start tracking them here.
          </p>
          <Button asChild>
            <Link href="/">Explore Assets</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
