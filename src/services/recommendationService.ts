
'use server';

import { db } from '@/lib/firebase';
import { collection, doc, getDoc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { z } from 'zod';
import type { GetAssetRecommendationOutput } from '@/ai/flows/get-asset-recommendation-flow';

// Schema for user profile stored in Firestore
export const UserProfileSchema = z.object({
  riskMode: z.enum(['cautious', 'balanced', 'aggressive']).default('balanced'),
  defaultHorizon: z.enum(['intraday', 'swing', 'position']).default('swing'),
  alertStyle: z.enum(['quiet', 'normal', 'takeover']).default('normal'),
  maxDailyLossPct: z.number().optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Schema for user's goals for a specific asset
export const UserGoalSchema = z.object({
  symbol: z.string(),
  targets: z.array(z.number()).optional(),
  buyZones: z.array(z.object({ type: z.string(), price: z.number() })).optional(),
  trailingStopPct: z.number().optional(),
  hardStopPct: z.number().optional(),
  horizon: z.enum(['intraday', 'swing', 'position']).optional(),
  riskModeOverride: z.enum(['cautious', 'balanced', 'aggressive']).optional(),
  alertStyle: z.enum(['quiet', 'normal', 'takeover']).optional(),
});
export type UserGoal = z.infer<typeof UserGoalSchema>;


/**
 * Fetches or creates a default user profile.
 * @param userId The ID of the user.
 * @returns The user's profile.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (!db) throw new Error("Firestore not available");
  const docRef = doc(db, 'userProfiles', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // Validate data from Firestore against our Zod schema
    return UserProfileSchema.parse(docSnap.data());
  } else {
    // Create a default profile if one doesn't exist
    const defaultProfile = UserProfileSchema.parse({});
    await setDoc(docRef, defaultProfile);
    return defaultProfile;
  }
}

/**
 * Updates a user's profile.
 * @param userId The ID of the user.
 * @param profileData Partial data to update the profile.
 */
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    if (!db) throw new Error("Firestore not available");
    const docRef = doc(db, 'userProfiles', userId);
    await setDoc(docRef, profileData, { merge: true });
}


/**
 * Fetches the user's goal for a specific asset.
 * @param userId The ID of the user.
 * @param symbol The asset symbol (e.g., 'AAPL', 'BTC').
 * @returns The user's goal for that asset, or null if not set.
 */
export async function getUserGoal(userId: string, symbol: string): Promise<UserGoal | null> {
    if (!db) throw new Error("Firestore not available");
    const docRef = doc(db, `userGoals/${userId}/goals`, symbol);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return UserGoalSchema.parse(docSnap.data());
    }
    return null;
}

/**
 * Sets or updates a user's goal for a specific asset.
 * @param userId The ID of the user.
 * @param goalData The goal data for the asset.
 */
export async function setUserGoal(userId: string, goalData: UserGoal): Promise<void> {
    if (!db) throw new Error("Firestore not available");
    const validatedGoal = UserGoalSchema.parse(goalData);
    const docRef = doc(db, `userGoals/${userId}/goals`, validatedGoal.symbol);
    await setDoc(docRef, validatedGoal, { merge: true });
}


/**
 * Saves a generated recommendation to Firestore.
 * @param userId The ID of the user.
 * @param symbol The asset symbol.
 * @param recommendation The recommendation data.
 */
export async function saveRecommendation(
    userId: string,
    symbol: string,
    recommendation: GetAssetRecommendationOutput
): Promise<void> {
    if (!db) throw new Error("Firestore not available");
    
    const recommendationWithMetadata = {
        userId,
        symbol,
        timestamp: Timestamp.now(),
        ...recommendation
    };

    const recommendationsCollection = collection(db, 'recommendations');
    await addDoc(recommendationsCollection, recommendationWithMetadata);
}
