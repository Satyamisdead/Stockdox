
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets as initialAssetSymbols } from "@/lib/placeholder-data"; 
import type { Asset } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import { useAuth } from "@/hooks/useAuth";
import { getAlertedAssetIds } from "@/services/userPreferenceService";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";

const FETCH_INTERVAL = 30000; // Fetch new quotes every 30 seconds

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  const previousPricesRef = useRef<Map<string, number>>(new Map());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user, loading: authLoading } = useAuth();
  const [userAlertPreferences, setUserAlertPreferences] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio('/audio/alert.mp3');
    }
  }, []);
  
  useEffect(() => {
    const fetchUserAlerts = async () => {
      if (user && !authLoading) {
        const prefs = await getAlertedAssetIds(user.uid);
        setUserAlertPreferences(prefs);
      } else if (!authLoading) {
        setUserAlertPreferences([]);
      }
    };
    fetchUserAlerts();
  }, [user, authLoading]);

  // Load initial data from Finnhub
  useEffect(() => {
    const symbolsToLoad = initialAssetSymbols; 

    const fetchInitialAssetData = async () => {
      setIsLoading(true);
      const initialPrices = new Map<string, number>();

      const assetDataPromises = symbolsToLoad.map(async (initialAsset) => {
        try {
          // Fetch profile and quote in parallel for each asset
          const [profile, quote] = await Promise.all([
            fetchProfileBySymbol(initialAsset.symbol, initialAsset.type),
            fetchQuoteBySymbol(initialAsset.symbol)
          ]);

          if (profile && quote && quote.c !== undefined) {
            const assetData: Asset = {
              id: initialAsset.symbol.toLowerCase(),
              symbol: initialAsset.symbol.toUpperCase(),
              name: profile.name || initialAsset.name,
              type: initialAsset.type,
              price: quote.c,
              change24h: quote.dp,
              dailyChange: quote.d,
              dailyHigh: quote.h,
              dailyLow: quote.l,
              dailyOpen: quote.o,
              previousClose: quote.pc,
              marketCap: profile.marketCapitalization,
              logoUrl: profile.logo || initialAsset.logoUrl,
              sector: profile.finnhubIndustry || initialAsset.sector,
              exchange: profile.exchange,
              volume24h: initialAsset.volume24h,
              peRatio: initialAsset.peRatio,
              epsDilutedTTM: initialAsset.epsDilutedTTM,
              circulatingSupply: initialAsset.circulatingSupply,
              allTimeHigh: initialAsset.allTimeHigh,
              icon: initialAsset.icon,
              dataAiHint: profile.logo ? undefined : initialAsset.dataAiHint,
            };
            if(assetData.price !== undefined) initialPrices.set(assetData.id, assetData.price);
            return assetData;
          } else {
            console.warn(`Could not fetch full Finnhub data for ${initialAsset.symbol}. Using placeholder data.`);
            const fallbackAsset: Asset = {
                ...initialAsset,
                id: initialAsset.symbol.toLowerCase(),
                price: initialAsset.price, 
                change24h: initialAsset.change24h, 
            };
            if (fallbackAsset.price !== undefined) {
                 initialPrices.set(fallbackAsset.id, fallbackAsset.price);
            }
            return fallbackAsset;
          }
        } catch (error) {
          console.error(`Error fetching data for ${initialAsset.symbol}:`, error);
          const fallbackOnError: Asset = {
            ...initialAsset,
            id: initialAsset.symbol.toLowerCase(),
            price: initialAsset.price, 
            change24h: initialAsset.change24h,
          };
          if (fallbackOnError.price !== undefined) {
            initialPrices.set(fallbackOnError.id, fallbackOnError.price);
          }
          return fallbackOnError;
        }
      });
      
      const fetchedAssetsResults = await Promise.all(assetDataPromises);
      // Filter out any potential nulls if map function could return null (though current logic returns fallbacks)
      const validAssets = fetchedAssetsResults.filter(asset => asset !== null) as Asset[];
      
      setAssets(validAssets);
      previousPricesRef.current = initialPrices;
      setIsLoading(false);
    };

    fetchInitialAssetData();
  }, []);

  // Interval to update quotes
  useEffect(() => {
    if (isLoading || assets.length === 0) return;

    const intervalId = setInterval(async () => {
      const updatedAssetsPromises = assets.map(async (currentAsset) => {
        const quote = await fetchQuoteBySymbol(currentAsset.symbol);
        if (quote && quote.c !== undefined) {
          const oldPrice = previousPricesRef.current.get(currentAsset.id) || currentAsset.price || 0;
          
          const newPrice = quote.c;
          if (userAlertPreferences.includes(currentAsset.id) && newPrice < oldPrice && oldPrice > 0) {
             const isStablecoin = currentAsset.type === 'crypto' && (currentAsset.symbol === 'USDT' || currentAsset.symbol === 'USDC' || currentAsset.symbol === 'DAI' || currentAsset.symbol === 'TUSD' || currentAsset.symbol === 'USDP');
             if (!isStablecoin) { 
                console.log(`Alert: ${currentAsset.name} price dropped to $${newPrice.toFixed(currentAsset.type === 'crypto' && (currentAsset.symbol === 'BTC' || currentAsset.symbol === 'ETH') ? 8 : 2)}`);
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
                }
             }
          }
          previousPricesRef.current.set(currentAsset.id, newPrice);

          return {
            ...currentAsset,
            price: newPrice,
            change24h: quote.dp,
            dailyChange: quote.d,
            dailyHigh: quote.h,
            dailyLow: quote.l,
            dailyOpen: quote.o,
            previousClose: quote.pc,
          };
        }
        return currentAsset; // Return old asset if fetch failed
      });

      const newAssets = await Promise.all(updatedAssetsPromises);
      setAssets(newAssets);
    }, FETCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [assets, isLoading, userAlertPreferences]); 

  const filteredAssets = useMemo(() => {
    if (isLoading && assets.length === 0) return [];

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

  const bitcoinAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'BTC'), [assets]);
  const appleAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'AAPL'), [assets]);
  
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="bg-background py-4 border-b border-border/40 shadow-sm flex flex-col items-start gap-4">
            
          <div className="w-full flex justify-start gap-4">
            <BitcoinMiniChartWidget 
              currentPrice={bitcoinAssetForWidget?.price}
              currentChangePercent={bitcoinAssetForWidget?.change24h ?? undefined}
            />
            <AppleStockMiniChartWidget 
              currentPrice={appleAssetForWidget?.price}
              currentChangePercent={appleAssetForWidget?.change24h ?? undefined}
            />
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
            <SearchBar onSearch={handleSearch} />
            <FilterControls onFilterChange={handleFilterChange} />
          </div>
        </div>

        {(isLoading && assets.length === 0) ? ( 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {[...Array(initialAssetSymbols.length)].map((_, i) => ( 
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
            {searchQuery && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
