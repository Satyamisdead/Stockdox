
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
  prompt: `You are a seasoned, risk-aware financial analyst AI for the Stockdox application. Your goal is to provide a decisive, actionable prediction for an asset, balancing opportunity with prudent risk management.

Your task is to analyze the provided asset and determine a "Buy", "Sell", or "Hold" recommendation based on a holistic view of general market principles.

Asset Name: {{{assetName}}} ({{{assetSymbol}}})
Asset Type: {{{assetType}}}

Consider the following approach:
- "Buy": Recommend when there are strong positive indicators and a favorable risk/reward ratio.
- "Sell": Be more inclined to recommend "Sell" if there are notable negative indicators, significant volatility, or if the market sentiment appears uncertain. Prioritize protecting users from potential losses over capturing marginal gains.
- "Hold": Use this recommendation for assets with genuinely mixed, neutral signals where a clear directional advantage isn't apparent. Avoid "Hold" as a default for uncertainty; if the situation is uncertain but leaning negative, prefer "Sell".

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

