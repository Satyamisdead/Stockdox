"use client";

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { Asset } from '@/types';
import { fetchQuotesForMultipleStocks } from '@/services/finnhubService';
import { fetchQuotesForMultipleCryptos } from '@/services/coingeckoService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  // Load initial watchlist from localStorage cache for instant UI rendering
  const [watchlist, setWatchlist] = useState<WatchlistAsset[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('stockdox_watchlist_cache');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });
  
  const prevPricesRef = useRef<Record<string, number>>({});

  // 1. Register Service Worker on Mount for native iOS/Android PWA notification support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered:', reg.scope))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }
  }, []);

  // 2. Play Custom Alert Audio
  const playIphoneChime = () => {
    if (typeof window === 'undefined') return;
    try {
      const audio = new Audio('/alert.mp3');
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } catch (e) {
      console.error('Audio playing failed:', e);
    }
  };

  // 3. Request Notification Permission
  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  };

  // 4. Send Notification Directly to Phone's System Notification Tray
  const triggerNotification = async (title: string, body: string) => {
    if (typeof window === 'undefined') return;

    // Check WebView wrapper native message handlers first (ReactNativeWebView or iOS message handler)
    try {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'notification', title, body }));
        return;
      } else if ((window as any).webkit?.messageHandlers?.notification) {
        (window as any).webkit.messageHandlers.notification.postMessage({ title, body });
        return;
      }
    } catch (e) {
      console.warn("Native bridge notification trigger failed:", e);
    }

    // Try service worker registration showNotification (sends notification to native iOS/Android tray)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          reg.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [100, 50, 100],
          } as any);
          return;
        }
      } catch (e) {
        console.warn("Service worker notification failed, falling back:", e);
      }
    }

    // Standard fallback to browser Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
      });
    }
  };

  // 5. Sync Watchlist from Firestore in Real-Time (with Local-First Cache Merge)
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !db) {
      // Do NOT clear local watchlist on guest loading (so it survives resets/offline)
      return;
    }

    const watchlistRef = collection(db, 'users', user.uid, 'watchlist');
    const unsubscribe = onSnapshot(watchlistRef, async (snapshot) => {
      const firestoreAssets: WatchlistAsset[] = [];
      snapshot.forEach((docSnap) => {
        firestoreAssets.push({ id: docSnap.id, ...docSnap.data() } as WatchlistAsset);
      });

      // Synchronize / Upload local items to Firestore if they are missing
      const localCached = localStorage.getItem('stockdox_watchlist_cache');
      let localAssets: WatchlistAsset[] = [];
      if (localCached) {
        try {
          localAssets = JSON.parse(localCached);
        } catch (e) {}
      }

      // Find local assets not present in Firestore (e.g. added offline or under a reset anonymous account)
      const missingInFirestore = localAssets.filter(
        (localItem) => !firestoreAssets.some((fsItem) => fsItem.id === localItem.id)
      );

      // Auto-upload local cache items to Firestore (self-healing upload)
      if (missingInFirestore.length > 0 && db && user) {
        console.log(`[Watchlist] Syncing ${missingInFirestore.length} local items to Firestore...`);
        for (const asset of missingInFirestore) {
          const docRef = doc(db, 'users', user.uid, 'watchlist', asset.id);
          await setDoc(docRef, {
            id: asset.id,
            name: asset.name,
            symbol: asset.symbol,
            type: asset.type,
            logoUrl: asset.logoUrl || '',
            price: asset.price || 0,
            change24h: asset.change24h || 0,
            alertSettings: asset.alertSettings || { alertOnPriceUp: true, alertOnPriceDown: true },
          }).catch((err) => console.error("Sync to Firestore failed:", err));
        }
      }

      // Combine Firestore data and local data
      const combined = [...firestoreAssets];
      missingInFirestore.forEach((item) => {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      });

      setWatchlist(combined);
      localStorage.setItem('stockdox_watchlist_cache', JSON.stringify(combined));
    }, (error) => {
      console.error('Firestore watchlist sync failed:', error);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // 6. Toggle Asset on Watchlist (Local-First Update)
  const toggleWatch = async (asset: Asset) => {
    requestNotificationPermission();

    const alreadyWatched = watchlist.some((w) => w.id === asset.id);
    let updatedWatchlist: WatchlistAsset[] = [];

    try {
      if (alreadyWatched) {
        updatedWatchlist = watchlist.filter((w) => w.id !== asset.id);
        setWatchlist(updatedWatchlist);
        localStorage.setItem('stockdox_watchlist_cache', JSON.stringify(updatedWatchlist));
        
        toast({
          title: 'Alerts Removed',
          description: `Removed ${asset.name} (${asset.symbol.toUpperCase()}) from watchlist.`,
        });

        if (user && db) {
          const docRef = doc(db, 'users', user.uid, 'watchlist', asset.id);
          await deleteDoc(docRef);
        }
      } else {
        const initialSettings = {
          alertOnPriceUp: true,
          alertOnPriceDown: true,
        };
        const newAsset: WatchlistAsset = {
          id: asset.id,
          name: asset.name,
          symbol: asset.symbol,
          type: asset.type,
          logoUrl: asset.logoUrl || '',
          price: asset.price || 0,
          change24h: asset.change24h || 0,
          alertSettings: initialSettings,
        };

        updatedWatchlist = [...watchlist, newAsset];
        setWatchlist(updatedWatchlist);
        localStorage.setItem('stockdox_watchlist_cache', JSON.stringify(updatedWatchlist));

        toast({
          title: 'Alerts Active',
          description: `Added ${asset.name} to watchlist. Audio alerts are active.`,
        });

        if (user && db) {
          const docRef = doc(db, 'users', user.uid, 'watchlist', asset.id);
          await setDoc(docRef, newAsset);
        }
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

  // 7. Update Custom Alert Conditions
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

  // 8. Check if Asset is Watched
  const isAssetWatched = (assetId: string) => {
    return watchlist.some((w) => w.id === assetId);
  };

  // 9. Background Price Checking Polling Loop
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
              
              // Custom Alert Toast Notification Banner Matching theme (solid black, yellow title, white text)
              toast({
                title: <span className="text-[#FFE600] font-bold text-sm font-headline tracking-wide">{title}</span>,
                description: <span className="text-white text-xs font-normal">{message}</span>,
                duration: 6000,
                className: cn(
                  "bg-black border border-border/80 border-l-4 text-white opacity-100 shadow-2xl border-r-0 border-y-0",
                  direction === 'up' ? "border-l-[#00D600]" : "border-l-rose-500"
                )
              } as any);

              // Save Alert Notification to Firestore
              if (db) {
                const notifRef = doc(collection(db, 'users', user.uid, 'notifications'));
                setDoc(notifRef, {
                  title,
                  message,
                  timestamp: new Date().toISOString(),
                  type: direction === 'up' ? 'price_up' : 'price_down',
                  assetId: asset.id,
                  symbol: asset.symbol
                }).catch((err) => console.error("Firestore notification save failed:", err));
              }

              // Sync back the newly fetched price to Firestore so watchlist is updated
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

  // 10. Random alert sound trigger mechanism for watchlisted items
  useEffect(() => {
    if (!user || watchlist.length === 0) return;

    let timerId: NodeJS.Timeout;

    const triggerRandomAlert = () => {
      // Play a short version of the custom alert audio (pause it after 1.5 seconds)
      if (typeof window !== 'undefined') {
        try {
          const audio = new Audio('/alert.mp3');
          audio.play().catch(e => console.error("Audio playback failed:", e));
          setTimeout(() => {
            try {
              audio.pause();
            } catch (e) {}
          }, 1500);
        } catch (e) {
          console.error('Audio playing failed:', e);
        }
      }

      // Trigger notification and toast
      const title = "Watchlist Update";
      const message = "Check the watchlist for recent asset price movements.";
      triggerNotification(title, message);
      
      // Custom Random Notification Toast Banner Matching theme (solid black, yellow title, white text)
      toast({
        title: <span className="text-[#FFE600] font-bold text-sm font-headline tracking-wide">{title}</span>,
        description: <span className="text-white text-xs font-normal">{message}</span>,
        duration: 5000,
        className: "bg-black border border-border/80 border-l-4 text-white opacity-100 shadow-2xl border-l-[#FFE600] border-r-0 border-y-0"
      } as any);

      // Save Random Notification to Firestore
      if (db) {
        const notifRef = doc(collection(db, 'users', user.uid, 'notifications'));
        setDoc(notifRef, {
          title,
          message,
          timestamp: new Date().toISOString(),
          type: 'random'
        }).catch((err) => console.error("Firestore random notification save failed:", err));
      }

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
