
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import { fetchQuotesForMultipleStocks } from "@/services/finnhubService";
import { fetchQuotesForMultipleCryptos } from "@/services/coingeckoService";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import { Skeleton } from "@/components/ui/skeleton";

function AssetGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
      {Array.from({ length: 8 }).map((_, i) => (
         <div key={i} className="flex flex-col space-y-3 p-4 rounded-lg border bg-card">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
               <Skeleton className="h-7 w-2/3" />
               <Skeleton className="h-4 w-1/3" />
            </div>
            <div className="flex justify-between items-center pt-4">
               <Skeleton className="h-9 w-24" />
               <Skeleton className="h-9 w-9" />
            </div>
         </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>(placeholderAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllQuotes = useCallback(async () => {
    setIsLoading(true);
    const stockSymbols = placeholderAssets.filter(a => a.type === 'stock').map(a => a.symbol);
    const cryptoIds = placeholderAssets.filter(a => a.type === 'crypto').map(a => a.id);

    try {
      const [stockQuotes, cryptoQuotes] = await Promise.all([
        fetchQuotesForMultipleStocks(stockSymbols),
        fetchQuotesForMultipleCryptos(cryptoIds)
      ]);
      
      const updatedAssets = placeholderAssets.map(asset => {
        if (asset.type === 'stock' && stockQuotes[asset.symbol]) {
          return { ...asset, ...stockQuotes[asset.symbol] };
        }
        if (asset.type === 'crypto' && cryptoQuotes[asset.id]) {
          return { ...asset, ...cryptoQuotes[asset.id] };
        }
        return asset;
      });
      
      setAssets(updatedAssets);

    } catch (error) {
      console.error("Failed to fetch quotes for dashboard:", error);
      // Keep placeholder data on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllQuotes();
  }, [fetchAllQuotes]);

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
  
  const bitcoinAssetForWidget = useMemo(() => assets.find(asset => asset.symbol.toUpperCase() === 'BTC'), [assets]);
  const appleAssetForWidget = useMemo(() => assets.find(asset => asset.symbol.toUpperCase() === 'AAPL'), [assets]);

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
            <AssetGridSkeleton />
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
