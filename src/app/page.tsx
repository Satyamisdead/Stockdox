
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  const previousPricesRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user, loading: authLoading } = useAuth();
  const [userAlertPreferences, setUserAlertPreferences] = useState<string[]>([]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/audio/alert.mp3');
    }
  }, []);
  
  // Fetch user alert preferences
  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (user && !authLoading) {
        const prefs = await getAlertedAssetIds(user.uid);
        setUserAlertPreferences(prefs);
      } else if (!authLoading) {
        setUserAlertPreferences([]); // Clear prefs if user logs out or not logged in
      }
    };
    fetchUserAlerts();
  }, [user, authLoading]);

  // Load initial data and set up previous prices ref
  useEffect(() => {
    const copiedAssets = JSON.parse(JSON.stringify(placeholderAssets)) as Asset[];
    setAssets(copiedAssets);

    const initialPrices = new Map<string, number>();
    copiedAssets.forEach(asset => initialPrices.set(asset.id, asset.price));
    previousPricesRef.current = initialPrices;
    
    // Simulate a delay for initial data loading appearance
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 500); // Reduced delay for faster perceived load

    return () => clearTimeout(timer);
  }, []);

  // Simulation interval
  useEffect(() => {
    if (assets.length === 0 || isLoading) return; // Don't run interval if no assets or still in initial load phase

    const intervalId = setInterval(() => {
      setAssets(prevAssets => {
        const newPreviousPrices = new Map<string, number>();
        const updatedAssets = prevAssets.map(asset => {
          const oldPrice = previousPricesRef.current.get(asset.id) || asset.price;
          newPreviousPrices.set(asset.id, asset.price); // Store current price as previous for next tick

          let newPrice = asset.price;
          let newChange24h = asset.change24h;

          if (asset.type === 'stock') {
            const priceChangeFactor = (Math.random() - 0.5) * 0.01; // Max +/- 0.5% change
            newPrice = asset.price * (1 + priceChangeFactor);
            newChange24h = asset.change24h + (Math.random() - 0.5) * 0.1;
          } else if (asset.type === 'crypto') {
            // Stablecoins should not fluctuate significantly
            if (asset.symbol === 'USDT' || asset.symbol === 'USDC' || asset.symbol === 'DAI' || asset.symbol === 'TUSD' || asset.symbol === 'USDP') {
              newPrice = 1.00; // Keep stablecoin price at 1.00
              // Simulate very minor fluctuation for change percentage only for stablecoins
              newChange24h = (Math.random() - 0.5) * 0.0002; 
            } else {
              const priceChangeFactor = (Math.random() - 0.48) * 0.025; // Max +/- 1.25% change for crypto, slightly biased upwards
              newPrice = asset.price * (1 + priceChangeFactor);
              newChange24h = asset.change24h + (Math.random() - 0.48) * 0.25;
            }
          }
          
          // Alert for stock price drops if oldPrice is available and user has alerts set
          if (userAlertPreferences.includes(asset.id) && newPrice < oldPrice && asset.type === 'stock' && oldPrice > 0) {
            console.log(`Alert: ${asset.name} price dropped to $${newPrice.toFixed(2)}`);
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
            }
          }

          // Alert for crypto price drops if oldPrice is available and user has alerts set
          // Exclude stablecoins from triggering audio alerts for their very minor simulated fluctuations
          if (
            userAlertPreferences.includes(asset.id) &&
            newPrice < oldPrice &&
            asset.type === 'crypto' &&
            oldPrice > 0 &&
            !(asset.symbol === 'USDT' || asset.symbol === 'USDC' || asset.symbol === 'DAI' || asset.symbol === 'TUSD' || asset.symbol === 'USDP')
          ) {
            console.log(`Alert: ${asset.name} price dropped to $${newPrice.toFixed(asset.symbol === 'BTC' || asset.symbol === 'ETH' ? 8 : (asset.price < 0.01 ? 6 : (asset.price < 1 ? 4 : 2)))}`);
            if (audioRef.current) {
              audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
            }
          }

          return {
            ...asset,
            price: parseFloat(newPrice.toFixed(asset.symbol === 'BTC' || asset.symbol === 'ETH' ? 8 : (asset.price < 0.01 ? 6 : (asset.price < 1 ? 4 : 2)))),
            change24h: parseFloat(newChange24h.toFixed(2)),
          };
        });
        
        previousPricesRef.current = newPreviousPrices;
        return updatedAssets;
      });
    }, SIMULATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, [assets, userAlertPreferences, isLoading]); // userAlertPreferences added as dependency

  // Derive filtered assets using useMemo
  const filteredAssets = useMemo(() => {
    if (isLoading) return []; // Return empty if still in initial loading phase to show skeletons

    let tempAssets = [...assets]; 

    if (searchQuery) {
      tempAssets = tempAssets.filter(
        (asset) =>
          asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeFilters.type !== "all") {
      tempAssets = tempAssets.filter(asset => asset.type === activeFilters.type);
    }
    
    return tempAssets;
  }, [assets, searchQuery, activeFilters, isLoading]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: { type: "all" | "stock" | "crypto" }) => {
    setActiveFilters(filters);
  };

  const bitcoinAssetForWidget = useMemo(() => assets.find(asset => asset.id === 'bitcoin'), [assets]);
  const appleAssetForWidget = useMemo(() => assets.find(asset => asset.id === 'aapl'), [assets]);
  
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="bg-background py-4 border-b border-border/40 shadow-sm flex flex-col items-start gap-4">
            
          <div className="w-full flex justify-start gap-4">
            <BitcoinMiniChartWidget 
              currentPrice={bitcoinAssetForWidget?.price}
              currentChangePercent={bitcoinAssetForWidget?.change24h}
            />
            <AppleStockMiniChartWidget 
              currentPrice={appleAssetForWidget?.price}
              currentChangePercent={appleAssetForWidget?.change24h}
            />
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <SearchBar onSearch={handleSearch} />
            <FilterControls onFilterChange={handleFilterChange} />
          </div>
        </div>

        {isLoading ? ( 
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
