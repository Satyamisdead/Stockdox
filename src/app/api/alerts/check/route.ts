import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { fetchQuotesForMultipleStocks } from '@/services/finnhubService';
import { fetchQuotesForMultipleCryptos } from '@/services/coingeckoService';

const firebaseConfig = {
  apiKey: "AIzaSyCw1LrhLFPYwPasxlVP6pkagbF3kdSwXkA",
  authDomain: "stockdox.firebaseapp.com",
  projectId: "stockdox",
  storageBucket: "stockdox.firebasestorage.app",
  messagingSenderId: "418859968883",
  appId: "1:418859968883:web:6df4d25d922455ebbefd06",
  measurementId: "G-4PGH4CZQG5"
};

// Initialize Firebase for serverless environment
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET() {
  try {
    // 1. Fetch all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const userIds = usersSnapshot.docs.map(docSnap => docSnap.id);
    
    let totalAlertsSent = 0;

    for (const userId of userIds) {
      // 2. Fetch watchlist for this user
      const watchlistRef = collection(db, 'users', userId, 'watchlist');
      const watchlistSnapshot = await getDocs(watchlistRef);
      if (watchlistSnapshot.empty) continue;

      const watchlist = watchlistSnapshot.docs.map(docSnap => docSnap.data());
      const stockSymbols = watchlist.filter(a => a.type === 'stock').map(a => a.symbol);
      const cryptoIds = watchlist.filter(a => a.type === 'crypto').map(a => a.id);

      // 3. Batch fetch current prices
      const [stockQuotes, cryptoQuotes] = await Promise.all([
        stockSymbols.length > 0 ? fetchQuotesForMultipleStocks(stockSymbols) : Promise.resolve({} as any),
        cryptoIds.length > 0 ? fetchQuotesForMultipleCryptos(cryptoIds) : Promise.resolve({} as any)
      ]);

      for (const asset of watchlist) {
        let newPrice: number | undefined;

        if (asset.type === 'stock' && stockQuotes[asset.symbol]) {
          newPrice = stockQuotes[asset.symbol].price;
        } else if (asset.type === 'crypto' && cryptoQuotes[asset.id]) {
          newPrice = cryptoQuotes[asset.id].price;
        }

        if (newPrice === undefined) continue;

        const oldPrice = asset.price;
        
        if (oldPrice !== undefined && oldPrice !== 0 && newPrice !== oldPrice) {
          const difference = newPrice - oldPrice;
          const diffPercent = (difference / oldPrice) * 100;
          const direction = difference > 0 ? 'up' : 'down';

          const settings = asset.alertSettings || { alertOnPriceUp: true, alertOnPriceDown: true };
          let shouldAlert = false;

          if (direction === 'up' && settings.alertOnPriceUp) {
            shouldAlert = true;
          } else if (direction === 'down' && settings.alertOnPriceDown) {
            shouldAlert = true;
          }

          if (settings.targetPriceUp && newPrice >= settings.targetPriceUp && oldPrice < settings.targetPriceUp) {
            shouldAlert = true;
          }
          if (settings.targetPriceDown && newPrice <= settings.targetPriceDown && oldPrice > settings.targetPriceDown) {
            shouldAlert = true;
          }

          if (shouldAlert) {
            const title = `Price Alert: ${asset.symbol.toUpperCase()} is ${direction}!`;
            const message = `${asset.name} price moved from $${oldPrice.toLocaleString()} to $${newPrice.toLocaleString()} (${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(2)}%)`;

            // Save to Firestore notifications collection
            const notifRef = doc(collection(db, 'users', userId, 'notifications'));
            await setDoc(notifRef, {
              title,
              message,
              timestamp: new Date().toISOString(),
              type: direction === 'up' ? 'price_up' : 'price_down',
              assetId: asset.id,
              symbol: asset.symbol
            });

            // Update watchlist document with the new price
            const watchAssetRef = doc(db, 'users', userId, 'watchlist', asset.id);
            await updateDoc(watchAssetRef, { price: newPrice });

            totalAlertsSent++;

            // =========================================================================
            // NATIVE APP PUSH NOTIFICATION TRIGGER (e.g. OneSignal / Firebase FCM)
            // =========================================================================
            // If your iOS/Android native WebView shell is configured with OneSignal or FCM, 
            // you can push notification alerts straight to their native device tray even if
            // the app/webview is closed:
            //
            // Example trigger:
            // await fetch("https://onesignal.com/api/v1/notifications", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json; charset=utf-8",
            //     "Authorization": "Basic YOUR_ONESIGNAL_REST_API_KEY"
            //   },
            //   body: JSON.stringify({
            //     app_id: "YOUR_ONESIGNAL_APP_ID",
            //     headings: { en: title },
            //     contents: { en: message },
            //     channel_for_external_user_ids: "push",
            //     include_external_user_ids: [userId] // Map userId (UUID) on device to OneSignal
            //   })
            // }).catch(err => console.error("OneSignal push failed:", err));
          }
        }
      }
    }

    return NextResponse.json({ success: true, alertsSent: totalAlertsSent });
  } catch (error: any) {
    console.error('[API Check Prices] Background Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
