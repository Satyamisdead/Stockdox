
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getWatchlistAssetIds, getAlertPreferences, type AlertCondition } from '@/services/userPreferenceService';
import type { Asset } from '@/types';
import { fetchQuotesForMultipleStocks } from '@/services/finnhubService';
import { fetchQuotesForMultipleCryptos } from '@/services/coingeckoService';
import { placeholderAssets } from '@/lib/placeholder-data';
import { useToast } from '@/hooks/use-toast';

const MONITOR_INTERVAL = 30000; // 30 seconds

export default function WatchlistMonitor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastPrices, setLastPrices] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio element on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/alert.mp3');
      Notification.requestPermission(); // Request notification permission early
    }
  }, []);

  const showNotification = (assetName: string) => {
    if (Notification.permission === 'granted') {
      new Notification('Stockdox Alert', {
        body: `${assetName} position has changed.`,
        icon: '/logo.png', // Assuming you have a logo in public folder
      });
      audioRef.current?.play().catch(e => console.error("Error playing alert sound:", e));
    } else {
        // Fallback for when notifications are not granted
        toast({
            title: "Stockdox Alert",
            description: `${assetName} position has changed.`,
        });
    }
  };
  
  const checkForAlerts = useCallback(async (
    watchlist: Asset[], 
    alertCondition: AlertCondition,
    currentPrices: Record<string, number>
  ) => {
    if (alertCondition === 'none' || Object.keys(lastPrices).length === 0) {
      return;
    }

    for (const asset of watchlist) {
      const lastPrice = lastPrices[asset.id];
      const currentPrice = currentPrices[asset.id];

      if (lastPrice === undefined || currentPrice === undefined || lastPrice === currentPrice) {
        continue;
      }
      
      const priceIncreased = currentPrice > lastPrice;
      const priceDecreased = currentPrice < lastPrice;

      let shouldAlert = false;
      if (alertCondition === 'increase' && priceIncreased) {
        shouldAlert = true;
      } else if (alertCondition === 'decrease' && priceDecreased) {
        shouldAlert = true;
      } else if (alertCondition === 'any' && (priceIncreased || priceDecreased)) {
        shouldAlert = true;
      }

      if (shouldAlert) {
        console.log(`Alert triggered for ${asset.name}: ${lastPrice} -> ${currentPrice}`);
        showNotification(asset.name);
      }
    }
  }, [lastPrices, toast]);


  const runMonitor = useCallback(async () => {
    if (!user) return;

    try {
      const [watchlistIds, alertPrefs] = await Promise.all([
        getWatchlistAssetIds(user.uid),
        getAlertPreferences(user.uid),
      ]);

      if (watchlistIds.length === 0 || alertPrefs.condition === 'none') {
        return;
      }

      const watchlistAssets = placeholderAssets.filter(asset => watchlistIds.includes(asset.id));
      const stockSymbols = watchlistAssets.filter(a => a.type === 'stock').map(a => a.symbol);
      const cryptoIds = watchlistAssets.filter(a => a.type === 'crypto').map(a => a.id);
      
      const [stockQuotes, cryptoQuotes] = await Promise.all([
        stockSymbols.length > 0 ? fetchQuotesForMultipleStocks(stockSymbols) : Promise.resolve({}),
        cryptoIds.length > 0 ? fetchQuotesForMultipleCryptos(cryptoIds) : Promise.resolve({}),
      ]);

      const currentPrices: Record<string, number> = {};
      const updatedWatchlist: Asset[] = [];

      watchlistAssets.forEach(asset => {
        let updatedAsset: Asset | null = null;
        if (asset.type === 'stock' && stockQuotes[asset.symbol]?.price !== undefined) {
          updatedAsset = { ...asset, price: stockQuotes[asset.symbol].price };
        } else if (asset.type === 'crypto' && cryptoQuotes[asset.id]?.price !== undefined) {
          updatedAsset = { ...asset, price: cryptoQuotes[asset.id].price };
        }

        if (updatedAsset && updatedAsset.price) {
            currentPrices[updatedAsset.id] = updatedAsset.price;
            updatedWatchlist.push(updatedAsset);
        }
      });
      
      await checkForAlerts(updatedWatchlist, alertPrefs.condition, currentPrices);

      setLastPrices(currentPrices);

    } catch (error) {
      console.error("Error during watchlist monitoring:", error);
    }
  }, [user, checkForAlerts]);

  useEffect(() => {
    if (user) {
      const intervalId = setInterval(runMonitor, MONITOR_INTERVAL);
      return () => clearInterval(intervalId);
    }
  }, [user, runMonitor]);

  // This component does not render anything
  return null;
}
