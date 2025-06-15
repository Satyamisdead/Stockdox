
"use client";

import type { Asset } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import PriceDisplay from "./PriceDisplay";
import { Button } from "@/components/ui/button";
import { BellRing, Loader2, DollarSign, Bitcoin, Briefcase } from "lucide-react"; 
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getAlertedAssetIds, toggleAlertForAsset } from "@/services/userPreferenceService";

type AssetCardProps = {
  asset: Asset;
};

export default function AssetCard({ asset }: AssetCardProps) {
  const FallbackIcon = asset.type === 'stock' ? Briefcase : asset.type === 'crypto' ? Bitcoin : DollarSign;
  const { toast } = useToast(); 
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
          // Error already logged in service
        } finally {
          setIsAlertLoading(false);
        }
      } else if (!authLoading) {
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
    } finally {
      setIsAlertLoading(false);
    }
  };

  // Determine icon: Lucide component, string character, or FallbackIcon
  let IconComponent;
  if (asset.icon && typeof asset.icon !== 'string') {
    IconComponent = asset.icon;
  } else {
    IconComponent = FallbackIcon; // Default fallback
  }


  return (
    <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {asset.logoUrl && asset.logoUrl !== 'https://placehold.co/40x40.png' ? ( // Check if logoUrl is not the placeholder
            <Image 
              src={asset.logoUrl} 
              alt={`${asset.name} logo`} 
              width={40} 
              height={40} 
              className="rounded-full"
              data-ai-hint={asset.dataAiHint || asset.name.toLowerCase().split(" ")[0]} // Use first word of name if no specific hint
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide image on error
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
            <CardDescription className="text-xs text-muted-foreground">{asset.symbol} - {asset.type === 'stock' ? 'Stock' : 'Crypto'}</CardDescription>
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
            <Button variant="ghost" size="icon" title="Set Alert" onClick={handleSetAlert} disabled={isAlertLoading || authLoading}>
              {isAlertLoading || (authLoading && !user) ? ( // Show loader if auth is loading and user isn't determined yet
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BellRing className={cn("h-4 w-4", isAlertActive ? "text-primary fill-primary/20" : "text-muted-foreground hover:text-primary")} />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
