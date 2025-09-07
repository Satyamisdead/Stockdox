
'use server';
/**
 * @fileOverview A Genkit flow for generating a stock/crypto prediction.
 *
 * - getAssetPrediction - A function that handles the asset prediction process.
 * - GetAssetPredictionInput - The input type for the getAssetPrediction function.
 * - GetAssetPredictionOutput - The return type for the getAssetPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetAssetPredictionInputSchema = z.object({
  assetName: z.string().describe('The name of the asset (e.g., "Apple Inc.", "Bitcoin").'),
  assetSymbol: z.string().describe('The symbol of the asset (e.g., "AAPL", "BTC").'),
  assetType: z.string().describe('The type of asset ("stock" or "crypto").'),
  timestamp: z.string().describe('The ISO 8601 timestamp of when the request was made.'),
});
export type GetAssetPredictionInput = z.infer<typeof GetAssetPredictionInputSchema>;

const GetAssetPredictionOutputSchema = z.object({
  prediction: z.enum(['Buy', 'Sell', 'Hold']).describe('The recommended action: Buy, Sell, or Hold.'),
});
export type GetAssetPredictionOutput = z.infer<typeof GetAssetPredictionOutputSchema>;


export async function getAssetPrediction(input: GetAssetPredictionInput): Promise<GetAssetPredictionOutput> {
  return getAssetPredictionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getAssetPredictionPrompt',
  input: {schema: GetAssetPredictionInputSchema},
  output: {schema: GetAssetPredictionOutputSchema},
  prompt: `You are an advanced, unpredictable, and dynamic trading analysis AI for the Stockdox application. Your primary function is to generate a trading signal ("Buy", "Sell", or "Hold") that simulates a highly active and random trading pattern. The current time is {{{timestamp}}}; use this to ensure every prediction is unique and not static.

Asset: {{{assetName}}} ({{{assetSymbol}}})

Your instructions are:
1.  **Embrace Randomness**: Do not follow a predictable pattern. Your goal is to produce a sequence of outputs that appears random and varied over time. You might suggest "Buy" twice, then "Sell", then "Buy" again.
2.  **"Hold" is Rare**: The "Hold" recommendation should be used very sparingly. It is better to issue a "Buy" or "Sell" call than to remain passive. Only issue a "Hold" signal once in a while.
3.  **Generate a Single Action**: Your final output must be one of three words: "Buy", "Sell", or "Hold".

Based on these instructions, provide a single, decisive trading signal for the asset at this exact moment.`,
});

const getAssetPredictionFlow = ai.defineFlow(
  {
    name: 'getAssetPredictionFlow',
    inputSchema: GetAssetPredictionInputSchema,
    outputSchema: GetAssetPredictionOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (output) {
        return output;
      }
      throw new Error("Received null output from prompt.");
    } catch(e) {
        console.error("[getAssetPredictionFlow] Error:", e);
        // Default to a conservative "Hold" on error.
        return {
            prediction: 'Hold',
        }
    }
  }
);
