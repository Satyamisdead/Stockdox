
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, type DocumentSnapshot, runTransaction } from 'firebase/firestore';

export type AlertCondition = 'increase' | 'decrease' | 'any' | 'none';

export interface UserPreferences {
  condition: AlertCondition;
}

interface UserPreferencesDoc {
  watchlistAssetIds?: string[];
  alertPreferences?: UserPreferences;
}

const PREFERENCES_COLLECTION = 'userPreferences';

// --- Watchlist Functions ---

export async function getWatchlistAssetIds(userId: string): Promise<string[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap: DocumentSnapshot<UserPreferencesDoc> = await getDoc(docRef) as DocumentSnapshot<UserPreferencesDoc>;

    if (docSnap.exists()) {
      return docSnap.data()?.watchlistAssetIds || [];
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
  
  const docRef = doc(db, PREFERENCES_COLLECTION, userId);

  try {
    return await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists()) {
        // Document doesn't exist, so create it with the new asset.
        transaction.set(docRef, { watchlistAssetIds: [assetId] });
        return true; // The asset is now ON the watchlist
      }

      const currentData = docSnap.data() as UserPreferencesDoc;
      const watchlist = currentData.watchlistAssetIds || [];
      const isOnWatchlist = watchlist.includes(assetId);

      if (isOnWatchlist) {
        // Asset is on watchlist, so remove it
        transaction.update(docRef, {
          watchlistAssetIds: arrayRemove(assetId)
        });
        return false; // The asset is now OFF the watchlist
      } else {
        // Asset is not on watchlist, so add it
        transaction.update(docRef, {
          watchlistAssetIds: arrayUnion(assetId)
        });
        return true; // The asset is now ON the watchlist
      }
    });
  } catch (error) {
    console.error("Error toggling asset in watchlist (transaction failed):", error);
    throw error;
  }
}

// --- Alert Preference Functions ---

export async function getAlertPreferences(userId: string): Promise<UserPreferences> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return { condition: 'none' };
  }
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef) as DocumentSnapshot<UserPreferencesDoc>;
    if (docSnap.exists() && docSnap.data()?.alertPreferences) {
      return docSnap.data()?.alertPreferences as UserPreferences;
    }
    // Return default preferences if not set
    return { condition: 'none' };
  } catch (error) {
    console.error("Error fetching alert preferences:", error);
    return { condition: 'none' };
  }
}

export async function saveAlertPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not available");
  }
  const docRef = doc(db, PREFERENCES_COLLECTION, userId);
  try {
    // Use setDoc with merge:true to create the doc if it doesn't exist, or update it if it does.
    await setDoc(docRef, { alertPreferences: preferences }, { merge: true });
  } catch (error) {
    console.error("Error saving alert preferences:", error);
    throw error;
  }
}
