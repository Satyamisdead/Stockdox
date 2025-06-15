
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets } from "@/lib/placeholder-data";
import type { Asset, FinnhubQuote, FinnhubProfile } from "@/types";
import { fetchQuoteBySymbol, fetchProfileBySymbol } from "@/services/finnhubService";
import Loading from "@/app/loading";
import BitcoinMiniChartWidget from "@/components/market/BitcoinMiniChartWidget";
import AppleStockMiniChartWidget from "@/components/market/AppleStockMiniChartWidget";

const FETCH_INTERVAL = 30000; // Fetch new quotes every 30 seconds

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<{ type: "all" | "stock" | "crypto" }>({ type: "all" });

  useEffect(() => {
    const fetchInitialAssetData = async () => {
      setIsLoading(true);
      console.log("Fetching initial asset data...");

      const assetPromises = placeholderAssets.map(async (pAsset) => {
        try {
          const profile = await fetchProfileBySymbol(pAsset.symbol, pAsset.type);
          const quote = await fetchQuoteBySymbol(pAsset.symbol);

          if (profile && quote && quote.c !== undefined) {
            return {
              id: pAsset.id,
              symbol: pAsset.symbol.toUpperCase(),
              name: profile.name || pAsset.name,
              type: pAsset.type,
              price: quote.c,
              change24h: quote.dp,
              dailyChange: quote.d,
              dailyHigh: quote.h,
              dailyLow: quote.l,
              dailyOpen: quote.o,
              previousClose: quote.pc,
              marketCap: profile.marketCapitalization || pAsset.marketCap,
              logoUrl: profile.logo || pAsset.logoUrl,
              sector: profile.finnhubIndustry || pAsset.sector,
              exchange: profile.exchange || pAsset.exchange,
              volume24h: pAsset.volume24h, // Placeholder, Finnhub basic quote doesn't have this for stocks
              icon: pAsset.icon,
              dataAiHint: profile.logo ? undefined : pAsset.dataAiHint, // Use placeholder hint if Finnhub logo is missing
              peRatio: pAsset.peRatio,
              epsDilutedTTM: pAsset.epsDilutedTTM,
              epsDilutedGrowthTTMYoY: pAsset.epsDilutedGrowthTTMYoY,
              dividendYieldTTM: pAsset.dividendYieldTTM,
              circulatingSupply: pAsset.circulatingSupply,
              allTimeHigh: pAsset.allTimeHigh,
              relativeVolume: pAsset.relativeVolume,
            };
          } else {
            console.warn(`Could not fetch full data for ${pAsset.symbol}. Using placeholder.`);
            return { ...pAsset, id: pAsset.symbol.toLowerCase() }; // Fallback to placeholder
          }
        } catch (error) {
          console.error(`Error fetching data for ${pAsset.symbol}:`, error);
          return { ...pAsset, id: pAsset.symbol.toLowerCase() }; // Fallback to placeholder on error
        }
      });

      try {
        const fetchedAssets = (await Promise.all(assetPromises)).filter(asset => asset !== null) as Asset[];
        console.log("Fetched assets:", fetchedAssets.length);
        setAssets(fetchedAssets);
      } catch (error) {
        console.error("Error fetching one or more assets:", error);
        setAssets(placeholderAssets.map(asset => ({...asset, id: asset.symbol.toLowerCase()}))); // Fallback to all placeholders on major error
      } finally {
        setIsLoading(false);
        console.log("Finished fetching initial data. isLoading: false");
      }
    };

    fetchInitialAssetData();
  }, []);


  useEffect(() => {
    if (isLoading || assets.length === 0) return; // Don't start polling if initial load isn't done or no assets

    const updateAssetQuotes = async () => {
      console.log("Polling for new quotes...");
      const updatedAssets = await Promise.all(
        assets.map(async (asset) => {
          const quote = await fetchQuoteBySymbol(asset.symbol);
          if (quote && quote.c !== undefined) {
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
          return asset; // Return original asset if quote fetch fails
        })
      );
      setAssets(updatedAssets);
      console.log("Quotes updated.");
    };

    const intervalId = setInterval(updateAssetQuotes, FETCH_INTERVAL);
    return () => clearInterval(intervalId);
  }, [assets, isLoading]);


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
    
    // Ensure assets always have some price for display even if not from Finnhub yet
    return tempAssets.map(asset => ({
        ...asset,
        price: asset.price !== undefined ? asset.price : 0,
        change24h: asset.change24h !== undefined ? asset.change24h : null,
    }));

  }, [assets, searchQuery, activeFilters]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filters: { type: "all" | "stock" | "crypto" }) => {
    setActiveFilters(filters);
  };

  const bitcoinAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'BTC'), [assets]);
  const appleAssetForWidget = useMemo(() => assets.find(asset => asset.symbol === 'AAPL'), [assets]);


  if (isLoading) {
    return <Loading />;
  }

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
          <div className="text-center py-16">
            <p className="text-xl text-muted-foreground">No assets found matching your criteria.</p>
            {searchQuery && <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters.</p>}
          </div>
        )}
      </section>
    </div>
  );
}

    