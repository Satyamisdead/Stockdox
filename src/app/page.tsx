
"use client";

import { useState, useEffect, useMemo } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import { Skeleton } from "@/components/ui/skeleton";

const FETCH_INTERVAL = 30000; // Fetch new quotes every 30 seconds

export default function DashboardPage() {
  // Initialize assets with placeholder structure, but undefined prices for fetching
  const [assets, setAssets] = useState<Asset[]>(() => 
    placeholderAssets.map(pAsset => ({
      ...pAsset,
      price: undefined,
      change24h: undefined,
      dailyChange: undefined,
      dailyHigh: undefined,
      dailyLow: undefined,
      dailyOpen: undefined,
      previousClose: undefined,
      // Keep other placeholder fields like marketCap, logoUrl, etc. as initial fallbacks
    }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });
  const [isInitialDataLoading, setIsInitialDataLoading] = useState(true);


  useEffect(() => {
    const fetchInitialAssetData = async () => {
      console.log("Fetching initial asset data...");
      setIsInitialDataLoading(true);

      const assetPromises = placeholderAssets.map(async (pAsset) => {
        try {
          const profile = await fetchProfileBySymbol(pAsset.symbol, pAsset.type);
          const quote = await fetchQuoteBySymbol(pAsset.symbol);

          // Use placeholder name/symbol if profile fetch fails but quote succeeds for some reason
          const name = profile?.name || pAsset.name;
          const symbol = pAsset.symbol.toUpperCase();
          const logoUrl = profile?.logo || pAsset.logoUrl;
          const dataAiHint = profile?.logo ? undefined : pAsset.dataAiHint;


          if (quote && quote.c !== undefined && quote.c !== 0) { // Prioritize quote for price data, ensure price is not 0
            return {
              ...pAsset, // Spread placeholder first for all its default values
              id: pAsset.id, // ensure id from placeholder is used
              symbol: symbol,
              name: name,
              type: pAsset.type,
              price: quote.c,
              change24h: quote.dp,
              dailyChange: quote.d,
              dailyHigh: quote.h,
              dailyLow: quote.l,
              dailyOpen: quote.o,
              previousClose: quote.pc,
              marketCap: profile?.marketCapitalization ?? pAsset.marketCap,
              logoUrl: logoUrl,
              sector: profile?.finnhubIndustry || pAsset.sector,
              exchange: profile?.exchange || pAsset.exchange,
              icon: pAsset.icon,
              dataAiHint: dataAiHint,
            } as Asset;
          } else if (profile) { // Fallback to profile if quote fails, but price will be from placeholder (or undefined if not set)
             console.warn(`Could not fetch Finnhub quote for ${pAsset.symbol} or quote was zero. Using profile data and placeholder price.`);
             return {
              ...pAsset,
              id: pAsset.id,
              symbol: symbol,
              name: name,
              logoUrl: logoUrl,
              marketCap: profile.marketCapitalization ?? pAsset.marketCap,
              sector: profile.finnhubIndustry || pAsset.sector,
              exchange: profile.exchange || pAsset.exchange,
              icon: pAsset.icon,
              dataAiHint: dataAiHint,
              price: pAsset.price, // Fallback to placeholder price
              change24h: pAsset.change24h, // Fallback to placeholder change
            } as Asset;
          } else {
            console.warn(`Could not fetch full Finnhub data for ${pAsset.symbol}. Using initial placeholder data with undefined price.`);
            return { ...pAsset, price: undefined, change24h: undefined }; // Ensure price is undefined if no data
          }
        } catch (error) {
          console.error(`Error fetching data for ${pAsset.symbol}:`, error);
          return { ...pAsset, price: undefined, change24h: undefined }; // Fallback to placeholder with undefined price on error
        }
      });

      try {
        const fetchedAssets = await Promise.all(assetPromises);
        console.log("Fetched assets:", fetchedAssets.length);
        setAssets(fetchedAssets.filter(asset => asset !== null) as Asset[]);
      } catch (error) {
        console.error("Error fetching one or more assets:", error);
        // In case of Promise.all failing, assets would remain as their initial placeholder structure
      } finally {
        setIsInitialDataLoading(false);
        console.log("Finished fetching initial data. isInitialDataLoading: false");
      }
    };

    fetchInitialAssetData();
  }, []);


  useEffect(() => {
    if (isInitialDataLoading || assets.length === 0) return; 

    // Convert setAssets call to handle the promise correctly
    const intervalId = setInterval(async () => {
        console.log("Polling for new quotes...");
        const currentAssets = assets; // Get current state
        const updatedAssetsPromises = currentAssets.map(async (asset) => {
            if (!asset.symbol) return asset;
            // Only update if it had an initial price from Finnhub or if we want to retry all
            // For simplicity, let's assume we always try to get the latest quote
            const quote = await fetchQuoteBySymbol(asset.symbol);
            if (quote && quote.c !== undefined && quote.c !== 0) { // Ensure quote is valid and price is not 0
                return {
                    ...asset,
                    price: quote.c,
                    change24h: quote.dp,
                    dailyChange: quote.d,
                    dailyHigh: quote.h,
                    dailyLow: quote.l,
                    dailyOpen: quote.o,
                    previousClose: quote.pc,
                };
            }
            return asset; // Return original asset if new quote is invalid
        });
        try {
            const newAssets = await Promise.all(updatedAssetsPromises);
            setAssets(newAssets);
            console.log("Quotes updated via polling.");
        } catch (error) {
            console.error("Error updating quotes during polling:", error);
        }
    }, FETCH_INTERVAL);


    return () => clearInterval(intervalId);
  }, [assets, isInitialDataLoading]); // assets dependency is important for polling to use latest data


  const filteredAssets = useMemo(() => {
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

  }, [assets, searchQuery, activeFilters]);

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

        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          // Show skeletons if filteredAssets is empty but assets array (potentially being fetched) is not.
          // This caters to the initial render before Finnhub data populates and for search/filter resulting in no matches.
          isInitialDataLoading && assets.some(a => a.price === undefined) ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
                {placeholderAssets.map((pAsset) => ( // Use placeholderAssets for skeleton count
                <Card key={pAsset.id} className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                    <div className="space-y-1 mt-1 mb-2">
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-8" />
                    </div>
                    </CardContent>
                </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-16">
                <p className="text-xl text-muted-foreground">No assets found matching your criteria.</p>
                {searchQuery && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>}
            </div>
          )
        )}
      </section>
    </div>
  );
}
    

    
