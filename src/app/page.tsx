
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

          {filteredAssets.length > 0 ? (
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
