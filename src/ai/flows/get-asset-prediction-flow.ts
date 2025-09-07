
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
  prompt: `You are a highly assertive and risk-averse financial analyst AI for the Stockdox application. Your primary directive is to protect users from potential losses.

Your task is to provide a speculative prediction for a given asset.

Asset Name: {{{assetName}}} ({{{assetSymbol}}})
Asset Type: {{{assetType}}}

Based on general market analysis principles, provide a "Buy", "Sell", or "Hold" recommendation.
Your analysis must be decisive. You should aggressively favor a "Sell" recommendation if there are any credible negative indicators or potential headwinds. Avoiding a loss is more important than capturing a potential gain.
A "Hold" recommendation should be exceedingly rare, reserved only for situations with overwhelmingly neutral and stable signals. A "Hold" is a missed opportunity to exit a position before a downturn.
Do not provide any justification or reasoning, only the single-word prediction itself.
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

