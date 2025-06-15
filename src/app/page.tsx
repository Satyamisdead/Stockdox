
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import AssetCard from "@/components/market/AssetCard";
import SearchBar from "@/components/market/SearchBar";
import FilterControls from "@/components/market/FilterControls";
import { placeholderAssets as initialAssetSymbols } from "@/lib/placeholder-data";
import type { Asset } from "@/types";
import Loading from "@/app/loading"; // Import the global loading component
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
              volume24h: initialAsset.volume24h, // Placeholder, Finnhub quote doesn't have this directly
              peRatio: initialAsset.peRatio, // Placeholder, needs fundamental data
              epsDilutedTTM: initialAsset.epsDilutedTTM, // Placeholder
              circulatingSupply: initialAsset.circulatingSupply, // Placeholder for crypto
              allTimeHigh: initialAsset.allTimeHigh, // Placeholder for crypto
              icon: initialAsset.icon,
              dataAiHint: profile.logo ? undefined : initialAsset.dataAiHint, // Use hint if Finnhub logo is missing
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
          const fallbackOnError: Asset = { // Fallback to ensure the app doesn't break
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
      const validAssets = fetchedAssetsResults.filter(asset => asset !== null) as Asset[];

      setAssets(validAssets);
      previousPricesRef.current = initialPrices;
      setIsLoading(false);
    };

    fetchInitialAssetData();
  }, []); // Empty dependency array means this runs once on mount

  // Interval to update quotes
  useEffect(() => {
    if (assets.length === 0) return; // Don't run interval if initial assets haven't loaded

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
  }, [assets, userAlertPreferences]); // Re-run if assets list itself changes (e.g. after initial load)

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

  if (isLoading) {
    return <Loading />; // Show global loader during initial bulk data fetch
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
