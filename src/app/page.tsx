
"use client";

import { useState, useEffect, useRef } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import { useAuth } from "@/hooks/useAuth";
import { getAlertedAssetIds } from "@/services/userPreferenceService";

const SIMULATION_INTERVAL = 3000; // Update every 3 seconds

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  const initialAssetsRef = useRef<Asset[]>([]);
  const previousPricesRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user, loading: authLoading } = useAuth();
  const [userAlertPreferences, setUserAlertPreferences] = useState<string[]>([]);

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/audio/alert.mp3'); // User needs to place this file
    }
  }, []);
  
  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (user && !authLoading) {
        const prefs = await getAlertedAssetIds(user.uid);
        setUserAlertPreferences(prefs);
      } else if (!authLoading) {
        setUserAlertPreferences([]); // Clear prefs if user logs out
      }
    };
    fetchUserAlerts();
  }, [user, authLoading]);

  useEffect(() => {
    const loadData = () => {
      const copiedAssets = JSON.parse(JSON.stringify(placeholderAssets)) as Asset[];
      initialAssetsRef.current = copiedAssets;
      setAssets(copiedAssets);
      setFilteredAssets(copiedAssets);
      setIsLoading(false);

      // Initialize previous prices
      const initialPrices = new Map<string, number>();
      copiedAssets.forEach(asset => initialPrices.set(asset.id, asset.price));
      previousPricesRef.current = initialPrices;
    };

    const timeoutId = setTimeout(loadData, 1000);

    const intervalId = setInterval(() => {
      setAssets(prevAssets => {
        if (prevAssets.length === 0) return prevAssets;

        const newPreviousPrices = new Map<string, number>();
        const updatedAssets = prevAssets.map(asset => {
          newPreviousPrices.set(asset.id, asset.price); // Store current price as previous for next tick

          if (asset.type === 'stock') {
            const priceChangeFactor = (Math.random() - 0.5) * 0.01; // Max +/- 0.5% change
            const newPrice = asset.price * (1 + priceChangeFactor);
            const newChange24h = asset.change24h + (Math.random() - 0.5) * 0.1;
            
            const oldPrice = previousPricesRef.current.get(asset.id) || asset.price;

            // Check for price drop alert
            if (userAlertPreferences.includes(asset.id) && newPrice < oldPrice) {
              console.log(`Alert: ${asset.name} price dropped to $${newPrice.toFixed(2)}`);
              if (audioRef.current) {
                audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
              }
            }

            return {
              ...asset,
              price: parseFloat(newPrice.toFixed(asset.symbol === 'BTC' || asset.symbol === 'ETH' ? 8 : 2)),
              change24h: parseFloat(newChange24h.toFixed(2)),
            };
          }
          return asset;
        });
        
        previousPricesRef.current = newPreviousPrices; // Update ref with new "previous" prices for the next interval
        return updatedAssets;
      });
    }, SIMULATION_INTERVAL);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAlertPreferences]); // Re-run if userAlertPreferences change, though interval logic itself doesn't directly depend on it to restart

   useEffect(() => {
    if (!isLoading) {
        applyFiltersAndSearch(assets, searchQuery, activeFilters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]); 

  const applyFiltersAndSearch = (currentAssets: Asset[], query: string, filters: { type: "all" | "stock" | "crypto" }) => {
    let tempAssets = [...currentAssets]; 

    if (query) {
      tempAssets = tempAssets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (filters.type !== "all") {
      tempAssets = tempAssets.filter(asset => asset.type === filters.type);
    }
    
    setFilteredAssets(tempAssets);
    setIsLoading(false); 
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsLoading(true); 
    applyFiltersAndSearch(initialAssetsRef.current, query, activeFilters);
  };

  const handleFilterChange = (filters: { type: "all" | "stock" | "crypto" }) => {
    setActiveFilters(filters);
    setIsLoading(true); 
    applyFiltersAndSearch(initialAssetsRef.current, searchQuery, filters);
  };
  
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="bg-background py-4 border-b border-border/40 shadow-sm flex flex-col items-start gap-4">
            
          <div className="w-full flex justify-start gap-4">
            <BitcoinMiniChartWidget />
            <AppleStockMiniChartWidget />
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <SearchBar onSearch={handleSearch} />
            <FilterControls onFilterChange={handleFilterChange} />
          </div>
        </div>

        {isLoading && filteredAssets.length === 0 ? ( 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {[...Array(8)].map((_, i) => ( 
              <Card key={i} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-1 flex-grow">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                   </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <Skeleton className="h-7 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <div className="mt-4 flex justify-between items-center pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No assets found matching your criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
}
