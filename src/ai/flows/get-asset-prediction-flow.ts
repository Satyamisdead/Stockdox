
'use server';
/**
 * @fileOverview A Genkit flow for generating a stock/crypto prediction.
 *
 * - getAssetPrediction - A function that handles the asset prediction process.
 * - GetAssetPredictionInput - The input type for the getAssetPrediction function.
 * - GetAssetPredictionOutput - The return type for the getAssetPrediction function.
 */

import {ai} from '@/ai/genkit';
import { getAssetPrice } from '@/ai/tools/get-asset-price-tool';
import { savePrediction } from '@/services/predictionHistoryService';
import {z} from 'genkit';

const GetAssetPredictionInputSchema = z.object({
  assetName: z.string().describe('The name of the asset (e.g., "Apple Inc.", "Bitcoin").'),
  assetSymbol: z.string().describe('The symbol of the asset (e.g., "AAPL", "BTC").'),
  assetType: z.string().describe('The type of asset ("stock" or "crypto").'),
  timestamp: z.string().describe('The ISO 8601 timestamp of when the request was made.'),
  assetId: z.string(), // Added assetId
  userId: z.string().optional(), // Added optional userId
});
export type GetAssetPredictionInput = z.infer<typeof GetAssetPredictionInputSchema>;

const GetAssetPredictionOutputSchema = z.object({
  prediction: z.enum(['Buy', 'Sell']).describe('The recommended action: Buy or Sell.'),
});
export type GetAssetPredictionOutput = z.infer<typeof GetAssetPredictionOutputSchema>;


export async function getAssetPrediction(input: GetAssetPredictionInput): Promise<GetAssetPredictionOutput> {
  return getAssetPredictionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getAssetPredictionPrompt',
  input: {schema: z.object({
    assetName: z.string(),
    assetSymbol: z.string(),
    assetType: z.string(),
    assetPrice: z.number().optional(),
  })},
  output: {schema: GetAssetPredictionOutputSchema},
  prompt: `You are a sophisticated financial analyst AI for the Stockdox application. Your role is to provide a quick, high-level trading signal ("Buy" or "Sell") based on a "flash analysis" of the provided asset.

Asset to Analyze:
- Name: {{{assetName}}} ({{{assetSymbol}}})
- Type: {{{assetType}}}
{{#if assetPrice}}- Current Price: \${{{assetPrice}}}{{/if}}

Your Instructions:
1.  **Analyze**: Perform a rapid, high-level analysis. For a stock, consider its sector and general market sentiment. For crypto, consider its role (e.g., L1, DeFi, meme) and recent market trends. You do not have access to live chart data, but you can use the provided current price as a key piece of information.
2.  **Decide**: Based on your brief analysis, determine if the immediate outlook is more favorable for a "Buy" or a "Sell".
3.  **Output**: Your final output must be a single word: "Buy" or "Sell". Do not provide "Hold" or any other explanation.

Based on these instructions, provide a single, decisive trading signal for the asset.`,
  tools: [getAssetPrice],
});

const getAssetPredictionFlow = ai.defineFlow(
  {
    name: 'getAssetPredictionFlow',
    inputSchema: GetAssetPredictionInputSchema,
    outputSchema: GetAssetPredictionOutputSchema,
  },
  async (input) => {
    let output: GetAssetPredictionOutput;
    try {
      // Use the getAssetPrice tool to fetch the current price
      const priceToolResult = await getAssetPrice.run({ symbol: input.assetSymbol });

      const result = await prompt({
          assetName: input.assetName,
          assetSymbol: input.assetSymbol,
          assetType: input.assetType,
          assetPrice: (priceToolResult as any).price,
      });

      if (result.output) {
        output = result.output;
      } else {
        throw new Error("Received null output from prompt.");
      }
    } catch(e) {
        console.error("[getAssetPredictionFlow] Error:", e);
        // Default to a random action on error.
        output = {
            prediction: Math.random() > 0.5 ? 'Buy' : 'Sell',
        }
    }

    if (input.userId) {
        // Save the prediction to history, but don't block the response
        savePrediction(input.userId, input.assetId, input.assetName, input.assetSymbol, output)
            .catch(saveError => console.error("[getAssetPredictionFlow] Failed to save prediction history:", saveError));
    }
    
    return output;
  }
);
