
"use client";

import { useState, useEffect, useMemo } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import { fetchQuoteBySymbol } from "@/services/finnhubService"; 
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";


export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>(placeholderAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });
  const [isLoading, setIsLoading] = useState(true);

  // Effect for fetching live data after initial load
  useEffect(() => {
    const fetchAllAssetsData = async () => {
      setIsLoading(true);
      const updatedAssets = await Promise.all(
        placeholderAssets.map(async (asset) => {
          try {
            const quote = await fetchQuoteBySymbol(asset.symbol);
            if (quote) {
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
          } catch (error) {
            console.error(`Failed to fetch data for ${asset.symbol}:`, error);
          }
          // Return original asset if fetch fails
          return asset;
        })
      );
      setAssets(updatedAssets);
      setIsLoading(false);
    };

    fetchAllAssetsData();
  }, []); // Run once on mount

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
  
  // For mini widgets, get the latest simulated data
  const bitcoinAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'BTC'), [assets]);
  const appleAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'AAPL'), [assets]);

  return (
    <>
      <div className="space-y-8 pt-4 md:pt-0">
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

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                     <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-1 mt-1 mb-2">
                        <Skeleton className="h-7 w-2/3" />
                        <Skeleton className="h-4 w-1/3" />
                     </div>
                     <div className="mt-4 flex justify-between items-center">
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-9" />
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
                <p className="text-xl text-muted-foreground">
                  No assets found matching your criteria.
                </p>
                {searchQuery && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
