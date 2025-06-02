
'use server'; // For potential future use if called from server actions, though primarily client-side for now.

import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, type DocumentSnapshot } from 'firebase/firestore';

const PREFERENCES_COLLECTION = 'userPreferences';
const ALERTS_FIELD = 'alertedAssetIds';

interface UserPreferencesDoc {
  [ALERTS_FIELD]?: string[];
}

/**
 * Fetches the asset IDs for which the user has enabled alerts.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of asset IDs.
 */
export async function getAlertedAssetIds(userId: string): Promise<string[]> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap: DocumentSnapshot<UserPreferencesDoc> = await getDoc(docRef) as DocumentSnapshot<UserPreferencesDoc>;

    if (docSnap.exists()) {
      return docSnap.data()?.[ALERTS_FIELD] || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user alert preferences:", error);
    return [];
  }
}

/**
 * Toggles the alert preference for a specific asset for a user.
 * @param userId The ID of the user.
 * @param assetId The ID of the asset.
 * @returns A promise that resolves to true if the alert is now active, false otherwise.
 */
export async function toggleAlertForAsset(userId: string, assetId: string): Promise<boolean> {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not available");
  }
  const docRef = doc(db, PREFERENCES_COLLECTION, userId);
  
  try {
    const docSnap = await getDoc(docRef);
    let currentlyAlerted = false;

    if (docSnap.exists()) {
      const data = docSnap.data() as UserPreferencesDoc;
      currentlyAlerted = data[ALERTS_FIELD]?.includes(assetId) || false;
    }

    if (currentlyAlerted) {
      // Remove assetId from alerts
      await updateDoc(docRef, {
        [ALERTS_FIELD]: arrayRemove(assetId)
      });
      return false; // Alert is now off
    } else {
      // Add assetId to alerts
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          [ALERTS_FIELD]: arrayUnion(assetId)
        });
      } else {
        // Document doesn't exist, create it
        await setDoc(docRef, {
          [ALERTS_FIELD]: [assetId]
        });
      }
      return true; // Alert is now on
    }
  } catch (error) {
    console.error("Error toggling asset alert preference:", error);
    throw error; // Re-throw to be caught by caller
  }
}
