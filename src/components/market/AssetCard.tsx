
"use client";

import type { Asset } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PriceDisplay from "./PriceDisplay";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2 } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAlertedAssetIds, toggleAlertForAsset } from "@/services/userPreferenceService";

type AssetCardProps = {
  asset: Asset;
};

export default function AssetCard({ asset }: AssetCardProps) {
  const IconComponent = asset.icon;
  const { toast } = useToast(); 
  const isMobile = useIsMobile();
  const { user, loading: authLoading } = useAuth();

  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isAlertLoading, setIsAlertLoading] = useState(false);

  useEffect(() => {
    const fetchAlertStatus = async () => {
      if (user && !authLoading) {
        setIsAlertLoading(true);
        try {
          const alertedIds = await getAlertedAssetIds(user.uid);
          setIsAlertActive(alertedIds.includes(asset.id));
        } catch (error) {
          // Already logged in service, toast shown by service or handleSetAlert
        } finally {
          setIsAlertLoading(false);
        }
      } else if (!authLoading) {
         // User not logged in or auth still loading, reset/keep default
        setIsAlertActive(false);
        setIsAlertLoading(false);
      }
    };

    fetchAlertStatus();
  }, [user, authLoading, asset.id]);

  const handleSetAlert = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your alert preferences.",
        variant: "default",
      });
      // Toggle locally for non-logged-in users for immediate feedback, won't persist.
      // Or, choose not to toggle if persistence is key:
      // setIsAlertActive(prev => !prev); 
      return;
    }

    setIsAlertLoading(true);
    try {
      const newAlertStatus = await toggleAlertForAsset(user.uid, asset.id);
      setIsAlertActive(newAlertStatus);
      toast({
        title: `Alert ${newAlertStatus ? 'Set' : 'Removed'}`,
        description: `Price alert for ${asset.name} ${newAlertStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error Updating Alert",
        description: "Could not update your alert preference. Please try again.",
        variant: "destructive",
      });
      // Optionally revert optimistic update if it was done:
      // setIsAlertActive(prev => !prev); 
    } finally {
      setIsAlertLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
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
      <CardContent className="flex-grow flex flex-col justify-between">
        <div> 
          <PriceDisplay price={asset.price} change={asset.change24h} symbol={asset.symbol} />
          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/asset/${asset.id}`}>View Details</Link>
            </Button>
            <Button variant="ghost" size="icon" title="Set Alert" onClick={handleSetAlert} disabled={isAlertLoading || authLoading}>
              {isAlertLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellRing className={cn("h-4 w-4", isAlertActive ? "text-primary" : "text-muted-foreground hover:text-primary")} />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
