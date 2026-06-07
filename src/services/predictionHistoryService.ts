
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { GetAssetPredictionOutput } from '@/ai/flows/get-asset-prediction-flow';

export interface PredictionRecord extends GetAssetPredictionOutput {
    userId: string;
    assetId: string;
    assetName: string;
    assetSymbol: string;
    timestamp: Date;
}

export async function savePrediction(
    userId: string,
    assetId: string,
    assetName: string,
    assetSymbol: string,
    predictionData: GetAssetPredictionOutput
): Promise<void> {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Firestore not available");
    }
    if (!userId) {
        console.warn("Cannot save prediction without a userId.");
        return;
    }

    try {
        const historyCollection = collection(db, 'predictionHistory');
        await addDoc(historyCollection, {
            userId,
            assetId,
            assetName,
            assetSymbol,
            prediction: predictionData.prediction,
            timestamp: Timestamp.fromDate(new Date()),
        });
    } catch (error) {
        console.error("Error saving prediction to Firestore:", error);
        // We don't throw here to avoid breaking the user-facing prediction flow
    }
}


export async function getPredictionHistory(userId: string, count: number = 20): Promise<PredictionRecord[]> {
    if (!db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    try {
        const historyCollection = collection(db, 'predictionHistory');
        const q = query(
            historyCollection, 
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(count)
        );

        const querySnapshot = await getDocs(q);
        const history: PredictionRecord[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            history.push({
                userId: data.userId,
                assetId: data.assetId,
                assetName: data.assetName,
                assetSymbol: data.assetSymbol,
                prediction: data.prediction,
                timestamp: (data.timestamp as Timestamp).toDate(),
            });
        });
        return history;
    } catch (error) {
        console.error("Error fetching user prediction history:", error);
        return [];
    }
}
