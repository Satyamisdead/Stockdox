
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export async function getWatchlist(userId: string): Promise<string[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const docRef = doc(db, 'watchlists', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data()?.assetIds || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user watchlist:", error);
    return [];
  }
}

export async function toggleWatchlistAsset(userId: string, assetId: string): Promise<boolean> {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not available");
  }

  const docRef = doc(db, 'watchlists', userId);

  try {
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists() || !docSnap.data()?.assetIds) {
      await setDoc(docRef, { assetIds: [assetId] });
      return true;
    }

    const watchlist = docSnap.data().assetIds as string[];
    const isOnWatchlist = watchlist.includes(assetId);

    if (isOnWatchlist) {
      await updateDoc(docRef, {
        assetIds: arrayRemove(assetId)
      });
      return false;
    } else {
      await updateDoc(docRef, {
        assetIds: arrayUnion(assetId)
      });
      return true;
    }
  } catch (error) {
    console.error("Error toggling asset in watchlist:", error);
    throw error;
  }
}
