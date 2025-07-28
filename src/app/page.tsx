
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
// Finnhub service import is removed as we are not fetching live data for the dashboard here.
// import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService"; 
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";
import Logo from "@/components/core/Logo";
import { cn } from "@/lib/utils";

// Simulation interval for price fluctuations
const SIMULATION_INTERVAL = 5000; // e.g., update every 5 seconds

export default function DashboardPage() {
  // Initialize assets directly with placeholder data
  const [assets, setAssets] = useState<Asset[]>(() => 
    placeholderAssets.map(pAsset => ({
      ...pAsset,
      // Ensure price and change24h are taken from placeholder if they exist
      price: pAsset.price, 
      change24h: pAsset.change24h,
      // Other fields that might have been undefined for Finnhub fetching, ensure they use placeholder values
      dailyChange: pAsset.dailyChange,
      dailyHigh: pAsset.dailyHigh,
      dailyLow: pAsset.dailyLow,
      dailyOpen: pAsset.dailyOpen,
      previousClose: pAsset.previousClose,
    }))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  const [isMobileHeaderVisible, setIsMobileHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Effect for scroll detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide header when scrolling down past a certain threshold, show when scrolling up
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setIsMobileHeaderVisible(false);
      } else {
        setIsMobileHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY; // For Mobile or negative scrolling
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Effect for simulating price fluctuations
  useEffect(() => {
    const intervalId = setInterval(() => {
      setAssets(currentAssets =>
        currentAssets.map(asset => {
          let newPrice = asset.price;
          let newChange24h = asset.change24h;
          let newDailyHigh = asset.dailyHigh;
          let newDailyLow = asset.dailyLow;

          if (typeof asset.price === 'number') {
            // Simulate price fluctuation: +/- up to 0.25% of current price
            const priceFluctuationFactor = (Math.random() - 0.5) * 0.005; 
            newPrice = asset.price * (1 + priceFluctuationFactor);
            
            // Adjust precision for display
            if (asset.type === 'crypto') {
                if (newPrice < 0.0001 && newPrice !== 0) newPrice = parseFloat(newPrice.toFixed(8));
                else if (newPrice < 0.01 && newPrice !== 0) newPrice = parseFloat(newPrice.toFixed(6));
                else if (newPrice < 1 && newPrice !== 0) newPrice = parseFloat(newPrice.toFixed(4));
                else newPrice = parseFloat(newPrice.toFixed(2));
            } else { // stocks
                 newPrice = parseFloat(newPrice.toFixed(2));
            }
          }

          if (typeof asset.change24h === 'number') {
            // Simulate change % fluctuation: +/- up to 0.1 percentage points
            const changeFluctuation = (Math.random() - 0.5) * 0.2; 
            newChange24h = parseFloat((asset.change24h + changeFluctuation).toFixed(2));
          }
          
          if (typeof newPrice === 'number') {
            newDailyHigh = Math.max(asset.dailyHigh ?? newPrice, newPrice);
            newDailyLow = Math.min(asset.dailyLow ?? newPrice, newPrice);
          }

          return {
            ...asset,
            price: newPrice,
            change24h: newChange24h,
            dailyHigh: newDailyHigh,
            dailyLow: newDailyLow,
          };
        })
      );
    }, SIMULATION_INTERVAL);

    return () => clearInterval(intervalId);
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

          {/* No global preloader, AssetCards handle their own state based on props */}
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
