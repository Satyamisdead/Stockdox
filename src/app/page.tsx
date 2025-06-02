
"use client";

import { useState, useEffect } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget"; // Import Apple widget

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  useEffect(() => {
    setTimeout(() => {
      setAssets(placeholderAssets);
      setFilteredAssets(placeholderAssets);
      setIsLoading(false);
    }, 1000);
  }, []);

  const applyFiltersAndSearch = (currentAssets: Asset[], query: string, filters: { type: "all" | "stock" | "crypto" }) => {
    let tempAssets = currentAssets;

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
    applyFiltersAndSearch(assets, query, activeFilters);
  };

  const handleFilterChange = (filters: { type: "all" | "stock" | "crypto" }) => {
    setActiveFilters(filters);
    setIsLoading(true);
    applyFiltersAndSearch(assets, searchQuery, filters);
  };
  
  return (
    <div className="space-y-8">
      <section className="space-y-6">
        <div className="bg-background py-4 border-b border-border/40 shadow-sm flex flex-col items-start gap-4">
            
          {/* Mini Widgets Container */}
          <div className="w-full flex justify-start gap-4">
            <BitcoinMiniChartWidget />
            <AppleStockMiniChartWidget />
          </div>

          {/* Search and Filter Bar */}
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
