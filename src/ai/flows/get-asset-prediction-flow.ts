
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
  prompt: `You are a financial analyst AI for the Stockdox application. Your goal is to provide assertive, actionable, and risk-aware predictions.
Your task is to provide a speculative prediction for a given asset.

Asset Name: {{{assetName}}} ({{{assetSymbol}}})
Asset Type: {{{assetType}}}

Based on general market analysis principles, provide a "Buy", "Sell", or "Hold" recommendation.
Your analysis should be decisive. Avoid a "Hold" recommendation if there are reasonable indicators for either a "Buy" or "Sell" signal.
A "Hold" should be reserved for situations with genuinely conflicting or neutral signals where taking a position would be a pure gamble.
Be more willing to suggest "Sell" if there are negative indicators to help users avoid potential losses.
Do not provide any justification or reasoning, only the prediction itself.
`,
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

