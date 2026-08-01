"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Asset } from '@/types';
import { fetchQuotesForMultipleStocks } from '@/services/finnhubService';
import { fetchQuotesForMultipleCryptos } from '@/services/coingeckoService';
import { useToast } from '@/hooks/use-toast';

export interface WatchlistAsset extends Asset {
  alertSettings?: {
    alertOnPriceUp: boolean;
    alertOnPriceDown: boolean;
    targetPriceUp?: number;
    targetPriceDown?: number;
  };
}

interface WatchlistContextType {
  watchlist: WatchlistAsset[];
  isAssetWatched: (assetId: string) => boolean;
  toggleWatch: (asset: Asset) => Promise<void>;
  updateAlertSettings: (assetId: string, settings: Partial<NonNullable<WatchlistAsset['alertSettings']>>) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistAsset[]>([]);
  const prevPricesRef = useRef<Record<string, number>>({});

  // 1. Play Synthesized iOS/iPhone Chime
  const playIphoneChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const playNode = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Ascending tri-tone chime (resembles iOS default alert)
      playNode(1046.50, now, 0.15);        // C6
      playNode(1318.51, now + 0.08, 0.20); // E6
      playNode(1567.98, now + 0.16, 0.30); // G6
    } catch (e) {
      console.error('Audio synthesis failed:', e);
    }
  };

  // 2. Request Notification Permission
  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // 3. Show Desktop Notification
  const triggerNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    }
  };

  // 4. Sync Watchlist from Firestore in Real-Time
  useEffect(() => {
    if (!user || !db) {
      setWatchlist([]);
      return;
    }

    const watchlistRef = collection(db, 'users', user.uid, 'watchlist');
    const unsubscribe = onSnapshot(watchlistRef, (snapshot) => {
      const assetsList: WatchlistAsset[] = [];
      snapshot.forEach((docSnap) => {
        assetsList.push({ id: docSnap.id, ...docSnap.data() } as WatchlistAsset);
      });
      setWatchlist(assetsList);
    }, (error) => {
      console.error('Firestore watchlist sync failed:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // 5. Toggle Asset on Watchlist
  const toggleWatch = async (asset: Asset) => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please log in to track stocks and receive alerts.',
        variant: 'destructive',
      });
      return;
    }
    if (!db) return;

    requestNotificationPermission();
    const docRef = doc(db, 'users', user.uid, 'watchlist', asset.id);
    const alreadyWatched = watchlist.some((w) => w.id === asset.id);

    try {
      if (alreadyWatched) {
        await deleteDoc(docRef);
        toast({
          title: 'Alerts Removed',
          description: `Removed ${asset.name} (${asset.symbol.toUpperCase()}) from watchlist.`,
        });
      } else {
        const initialSettings = {
          alertOnPriceUp: true,
          alertOnPriceDown: true,
        };
        const dataToSave = {
          id: asset.id,
          name: asset.name,
          symbol: asset.symbol,
          type: asset.type,
          logoUrl: asset.logoUrl || '',
          price: asset.price || 0,
          change24h: asset.change24h || 0,
          alertSettings: initialSettings,
        };
        await setDoc(docRef, dataToSave);
        toast({
          title: 'Alerts Active',
          description: `Added ${asset.name} to watchlist. Audio alerts are active.`,
        });
      }
    } catch (error) {
      console.error('Error toggling watchlist document:', error);
      toast({
        title: 'Error',
        description: 'Could not update watchlist. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // 6. Update Custom Alert Conditions
  const updateAlertSettings = async (assetId: string, settings: Partial<NonNullable<WatchlistAsset['alertSettings']>>) => {
    if (!user || !db) return;
    const docRef = doc(db, 'users', user.uid, 'watchlist', assetId);
    const targetAsset = watchlist.find(w => w.id === assetId);
    if (!targetAsset) return;

    const newSettings: any = {
      ...(targetAsset.alertSettings || { alertOnPriceUp: true, alertOnPriceDown: true }),
      ...settings
    };

    // Strip out undefined values to prevent Firestore validation failures
    Object.keys(newSettings).forEach((key) => {
      if (newSettings[key] === undefined) {
        delete newSettings[key];
      }
    });

    try {
      await updateDoc(docRef, { alertSettings: newSettings });
      toast({
        title: 'Alert Target Updated',
        description: 'Custom notifications settings saved successfully.',
      });
    } catch (error) {
      console.error('Error updating watchlist document:', error);
      toast({
        title: 'Error',
        description: 'Failed to save custom alerts.',
        variant: 'destructive',
      });
    }
  };

  // 7. Check if Asset is Watched
  const isAssetWatched = (assetId: string) => {
    return watchlist.some((w) => w.id === assetId);
  };

  // 8. Background Price Checking Polling Loop
  useEffect(() => {
    if (!user || watchlist.length === 0) {
      return;
    }

    const checkPrices = async () => {
      const stockSymbols = watchlist.filter(a => a.type === 'stock').map(a => a.symbol);
      const cryptoIds = watchlist.filter(a => a.type === 'crypto').map(a => a.id);

      try {
        const [stockQuotes, cryptoQuotes] = await Promise.all([
          stockSymbols.length > 0 ? fetchQuotesForMultipleStocks(stockSymbols) : Promise.resolve({} as Record<string, Partial<Asset>>),
          cryptoIds.length > 0 ? fetchQuotesForMultipleCryptos(cryptoIds) : Promise.resolve({} as Record<string, Partial<Asset>>)
        ]);

        watchlist.forEach(async (asset) => {
          let newPrice: number | undefined;

          if (asset.type === 'stock' && stockQuotes[asset.symbol]) {
            newPrice = stockQuotes[asset.symbol].price;
          } else if (asset.type === 'crypto' && cryptoQuotes[asset.id]) {
            newPrice = cryptoQuotes[asset.id].price;
          }

          if (newPrice === undefined) return;

          const oldPrice = prevPricesRef.current[asset.id] || asset.price;
          prevPricesRef.current[asset.id] = newPrice;

          if (oldPrice !== undefined && oldPrice !== 0 && newPrice !== oldPrice) {
            const difference = newPrice - oldPrice;
            const diffPercent = (difference / oldPrice) * 100;
            const direction = difference > 0 ? 'up' : 'down';

            // Check if alert conditions match
            const settings = asset.alertSettings || { alertOnPriceUp: true, alertOnPriceDown: true };
            let shouldAlert = false;

            if (direction === 'up' && settings.alertOnPriceUp) {
              shouldAlert = true;
            } else if (direction === 'down' && settings.alertOnPriceDown) {
              shouldAlert = true;
            }

            // Check custom absolute price targets
            if (settings.targetPriceUp && newPrice >= settings.targetPriceUp && oldPrice < settings.targetPriceUp) {
              shouldAlert = true;
            }
            if (settings.targetPriceDown && newPrice <= settings.targetPriceDown && oldPrice > settings.targetPriceDown) {
              shouldAlert = true;
            }

            if (shouldAlert) {
              playIphoneChime();
              
              const title = `Price Alert: ${asset.symbol.toUpperCase()} is ${direction}!`;
              const message = `${asset.name} price moved from $${oldPrice.toLocaleString()} to $${newPrice.toLocaleString()} (${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(2)}%)`;
              
              triggerNotification(title, message);
              toast({
                title,
                description: message,
                duration: 5000,
              });

              // Optional: Sync back the newly fetched price to Firestore so watchlist is updated
              if (db) {
                const docRef = doc(db, 'users', user.uid, 'watchlist', asset.id);
                updateDoc(docRef, { price: newPrice }).catch(() => {});
              }
            }
          }
        });
      } catch (err) {
        console.error('Background price verification check failed:', err);
      }
    };

    // Initialize previous price references
    watchlist.forEach(asset => {
      if (asset.price && !prevPricesRef.current[asset.id]) {
        prevPricesRef.current[asset.id] = asset.price;
      }
    });

    const intervalId = setInterval(checkPrices, 30000); // Poll every 30 seconds
    return () => clearInterval(intervalId);
  }, [user, watchlist, toast]);

  // 9. Random alert sound trigger mechanism for watchlisted items
  useEffect(() => {
    if (!user || watchlist.length === 0) return;

    let timerId: NodeJS.Timeout;

    const triggerRandomAlert = () => {
      // Play a short version of the chime (D6 -> G6)
      if (typeof window !== 'undefined') {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const playNode = (freq: number, startTime: number, duration: number) => {
              const osc = ctx.createOscillator();
              const gainNode = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, startTime);
              gainNode.gain.setValueAtTime(0, startTime);
              gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.015);
              gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
              osc.connect(gainNode);
              gainNode.connect(ctx.destination);
              osc.start(startTime);
              osc.stop(startTime + duration);
            };
            const now = ctx.currentTime;
            // Short 2-note chime
            playNode(1174.66, now, 0.12);        // D6
            playNode(1567.98, now + 0.07, 0.18); // G6
          }
        } catch (e) {
          console.error('Audio synthesis failed:', e);
        }
      }

      // Trigger notification and toast
      const title = "Watchlist Update";
      const message = "Check the watchlist for recent asset price movements.";
      triggerNotification(title, message);
      toast({
        title,
        description: message,
        duration: 4000,
      });

      // Schedule the next alert at a random interval
      scheduleNext();
    };

    const scheduleNext = () => {
      // Random interval between 2 minutes (120,000 ms) and 8 minutes (480,000 ms)
      const minMs = 120000;
      const maxMs = 480000;
      const randomDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
      
      console.log(`[Watchlist] Next random alert scheduled in ${(randomDelay / 1000 / 60).toFixed(2)} minutes.`);
      timerId = setTimeout(triggerRandomAlert, randomDelay);
    };

    // Start the first schedule
    scheduleNext();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [user, watchlist.length, toast]);

  return (
    <WatchlistContext.Provider value={{ watchlist, isAssetWatched, toggleWatch, updateAlertSettings }}>
      {children}
    </WatchlistContext.Provider>
  );
};
