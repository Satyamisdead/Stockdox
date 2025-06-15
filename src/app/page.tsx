
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
import { Skeleton } from "@/components/ui/skeleton"; // Card Skeleton is used within AssetCard

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
  // No global isLoading state, individual cards will manage their loading appearance

  useEffect(() => {
    const fetchInitialAssetData = async () => {
      console.log("Fetching initial asset data for all placeholder assets...");

      const assetPromises = placeholderAssets.map(async (pAsset) => {
        try {
          const profile = await fetchProfileBySymbol(pAsset.symbol, pAsset.type);
          const quote = await fetchQuoteBySymbol(pAsset.symbol);

          const name = profile?.name || pAsset.name;
          const symbol = pAsset.symbol.toUpperCase();
          const logoUrl = profile?.logo || pAsset.logoUrl;
          const dataAiHint = profile?.logo ? undefined : pAsset.dataAiHint;

          let fetchedAssetData: Asset = {
            ...pAsset, // Spread placeholder first for all its default values
            id: pAsset.id,
            symbol: symbol,
            name: name,
            type: pAsset.type,
            logoUrl: logoUrl,
            sector: profile?.finnhubIndustry || pAsset.sector,
            exchange: profile?.exchange || pAsset.exchange,
            marketCap: profile?.marketCapitalization ?? pAsset.marketCap,
            icon: pAsset.icon,
            dataAiHint: dataAiHint,
            // Price data will be undefined initially, then populated
            price: undefined,
            change24h: undefined,
            dailyChange: undefined,
            dailyHigh: undefined,
            dailyLow: undefined,
            dailyOpen: undefined,
            previousClose: undefined,
          };

          if (quote && quote.c !== undefined && quote.c !== 0) {
            fetchedAssetData = {
              ...fetchedAssetData,
              price: quote.c,
              change24h: quote.dp,
              dailyChange: quote.d,
              dailyHigh: quote.h,
              dailyLow: quote.l,
              dailyOpen: quote.o,
              previousClose: quote.pc,
            };
          } else if (profile) {
             console.warn(`Could not fetch Finnhub quote for ${pAsset.symbol} or quote was zero. Using profile data and placeholder price if available.`);
             fetchedAssetData.price = pAsset.price; // Fallback to placeholder price if any
             fetchedAssetData.change24h = pAsset.change24h;
          } else {
            console.warn(`Could not fetch full Finnhub data for ${pAsset.symbol}. Using initial placeholder data with undefined price.`);
            // Price and change already undefined
          }
          return fetchedAssetData;
        } catch (error) {
          console.error(`Error fetching data for ${pAsset.symbol}:`, error);
          // Return placeholder with undefined price on error
          return { 
            ...pAsset, 
            price: undefined, 
            change24h: undefined,
            dailyChange: undefined,
            dailyHigh: undefined,
            dailyLow: undefined,
            dailyOpen: undefined,
            previousClose: undefined,
          }; 
        }
      });

      try {
        const fetchedAssetsResults = await Promise.all(assetPromises);
        console.log("Fetched assets results:", fetchedAssetsResults.length);
        setAssets(fetchedAssetsResults.filter(asset => asset !== null) as Asset[]);
      } catch (error) {
        console.error("Error fetching one or more assets during initial load:", error);
      }
      console.log("Finished attempting to fetch initial data for all assets.");
    };

    fetchInitialAssetData();
  }, []);


  useEffect(() => {
    // Only start polling if there are assets, to avoid errors if initial fetch fails catastrophically (though unlikely with current setup)
    if (assets.length === 0) return;

    const intervalId = setInterval(async () => {
        console.log("Polling for new quotes...");
        // Use functional update to ensure we're working with the latest state
        setAssets(currentAssets => {
            const updatedAssetsPromises = currentAssets.map(async (asset) => {
                if (!asset.symbol || asset.price === undefined) { // Don't poll if symbol missing or initial fetch failed for price
                    return asset;
                }
                const quote = await fetchQuoteBySymbol(asset.symbol);
                if (quote && quote.c !== undefined && quote.c !== 0) {
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
                return asset; 
            });
            // This part needs to be handled carefully with functional updates
            // Since Promise.all itself is async, directly returning it inside setAssets won't work as expected.
            // We should resolve promises then update state.
            Promise.all(updatedAssetsPromises).then(newAssets => {
                 // Check if component is still mounted or if assets changed to avoid race conditions
                 // For simplicity here, directly setting. In complex scenarios, add checks.
                setAssets(newAssets); 
                console.log("Quotes updated via polling.");
            }).catch(error => {
                console.error("Error updating quotes during polling:", error);
            });
            return currentAssets; // Return current assets immediately, update will happen once promises resolve
        });
    }, FETCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [assets.length]); // Re-run effect if asset count changes (e.g., if we had dynamic list) - for now, mostly for initial setup


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

        {/* 
          No global preloader here. 
          AssetCards will individually show skeletons if their price is undefined.
        */}
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-6">
            {filteredAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        ) : (
          // This message shows if, after attempting to load data, no assets match filters OR
          // if initial placeholder list itself was empty (which it isn't in our case).
          // AssetCards handle their own skeleton state if price data is pending.
          <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">
                {assets.some(a => a.price === undefined) && searchQuery === "" && activeFilters.type === "all" 
                  ? "Loading asset data..." // Message if still fetching initial data for non-filtered view
                  : "No assets found matching your criteria."}
              </p>
              {searchQuery && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
