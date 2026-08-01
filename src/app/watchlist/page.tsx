
"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Asset } from "@/types";
import AssetCard from "@/components/market/AssetCard";
import { EyeOff, Settings, Bell, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Loading from "@/app/loading";
import { useWatchlist, WatchlistAsset } from "@/contexts/WatchlistContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { watchlist, updateAlertSettings } = useWatchlist();
  
  const [selectedAsset, setSelectedAsset] = useState<WatchlistAsset | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Alert settings states
  const [alertOnPriceUp, setAlertOnPriceUp] = useState(true);
  const [alertOnPriceDown, setAlertOnPriceDown] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/signin?redirect=/watchlist");
    }
  }, [user, authLoading, router]);

  const handleOpenSettings = (asset: WatchlistAsset) => {
    setSelectedAsset(asset);
    setAlertOnPriceUp(asset.alertSettings?.alertOnPriceUp ?? true);
    setAlertOnPriceDown(asset.alertSettings?.alertOnPriceDown ?? true);
    setIsDialogOpen(true);
  };

  const handleTogglePriceUp = async (checked: boolean) => {
    if (!selectedAsset) return;
    setAlertOnPriceUp(checked);
    await updateAlertSettings(selectedAsset.id, {
      alertOnPriceUp: checked
    });
  };

  const handleTogglePriceDown = async (checked: boolean) => {
    if (!selectedAsset) return;
    setAlertOnPriceDown(checked);
    await updateAlertSettings(selectedAsset.id, {
      alertOnPriceDown: checked
    });
  };

  if (authLoading) {
     return <Loading />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 font-headline text-primary">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your watchlist.</p>
        <Button asChild><Link href="/signin?redirect=/watchlist">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary font-headline">Your Watchlist</h1>
      </div>

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchlist.map((asset) => (
            <div key={asset.id} className="flex flex-col h-full space-y-2">
              <div className="flex-grow">
                <AssetCard asset={asset} />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleOpenSettings(asset)}
                className="w-full gap-1.5 border-primary/20 hover:border-primary/50 text-xs font-semibold"
              >
                <Settings className="h-3.5 w-3.5 text-primary" /> Alert Settings
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-lg shadow-lg border border-border/40">
          <EyeOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your watchlist is empty.</h2>
          <p className="text-muted-foreground mb-6">
            Click the bell icon on the dashboard to track stocks and enable alarms.
          </p>
          <Button asChild>
            <Link href="/">Explore Assets</Link>
          </Button>
        </div>
      )}

      {/* Alert Settings Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border/80">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-headline text-primary">
              Watchlist Settings
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Configure trigger parameters for {selectedAsset?.name} ({selectedAsset?.symbol.toUpperCase()}) updates.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Play Sound switches */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="price-up-alert" className="text-sm font-medium flex items-center gap-1.5">
                  <ArrowUp className="h-4 w-4 text-emerald-500" /> Alert on Price Increase
                </Label>
                <p className="text-xs text-muted-foreground">Plays chime when stock climbs.</p>
              </div>
              <Switch
                id="price-up-alert"
                checked={alertOnPriceUp}
                onCheckedChange={handleTogglePriceUp}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="price-down-alert" className="text-sm font-medium flex items-center gap-1.5">
                  <ArrowDown className="h-4 w-4 text-rose-500" /> Alert on Price Drop
                </Label>
                <p className="text-xs text-muted-foreground">Plays chime when stock falls.</p>
              </div>
              <Switch
                id="price-down-alert"
                checked={alertOnPriceDown}
                onCheckedChange={handleTogglePriceDown}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
