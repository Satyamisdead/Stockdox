
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
  prompt: `You are a seasoned, risk-aware financial analyst AI for the Stockdox application. Your primary goal is to provide a decisive, actionable prediction that prioritizes protecting the user from losses.

Your task is to analyze the provided asset and determine a "Buy", "Sell", or "Hold" recommendation. The current time is {{{timestamp}}}. Use this timestamp to introduce slight variability in your decision-making process, simulating the dynamic nature of financial markets.

Asset Name: {{{assetName}}} ({{{assetSymbol}}})
Asset Type: {{{assetType}}}

Adopt the following aggressive, loss-avoidance strategy:
- "Buy": Recommend only when there are strong, clear positive indicators and a favorable risk/reward ratio.
- "Sell": You should recommend "Sell" much more often than "Hold." If there are any notable negative indicators, significant volatility, or if the market sentiment appears even slightly uncertain or negative, issue a "Sell" recommendation. Your priority is to prevent losses. A "Hold" recommendation during a potential downturn is a missed opportunity to exit a position.
- "Hold": Use this recommendation very sparingly. Reserve "Hold" only for assets with genuinely mixed, neutral signals where a clear directional advantage isn't apparent and downside risk seems minimal. When in doubt, prefer "Sell" over "Hold".

Provide only the single-word prediction based on your analysis. Do not include any reasoning or justification.
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
