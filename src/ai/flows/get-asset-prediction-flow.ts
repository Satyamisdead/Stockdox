
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
  justification: z.string().describe('A brief, 1-2 sentence justification for the prediction based on general market principles.'),
  disclaimer: z.string().describe('A standard disclaimer about the nature of AI predictions.'),
});
export type GetAssetPredictionOutput = z.infer<typeof GetAssetPredictionOutputSchema>;


export async function getAssetPrediction(input: GetAssetPredictionInput): Promise<GetAssetPredictionOutput> {
  return getAssetPredictionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'getAssetPredictionPrompt',
  input: {schema: GetAssetPredictionInputSchema},
  output: {schema: GetAssetPredictionOutputSchema},
  prompt: `You are a financial analyst AI for the Stockdox application.
Your task is to provide a speculative prediction for a given asset.

Asset Name: {{{assetName}}} ({{{assetSymbol}}})
Asset Type: {{{assetType}}}

Based on general market analysis principles and the asset type, provide a "Buy", "Sell", or "Hold" recommendation.
Your justification should be brief and based on common analysis patterns (e.g., "strong recent performance and positive sector trends suggest potential for growth," or "high volatility and recent downturns suggest caution"). Do not use real-time data or claim to have inside information. This is a purely speculative analysis based on general knowledge.

Finally, you MUST provide the following standard disclaimer, verbatim:
"This is an AI-generated prediction and not financial advice. It is for informational purposes only. Always do your own research and consult with a qualified financial advisor before making any investment decisions."

Generate a prediction, a short justification, and the disclaimer.
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
        return {
            prediction: 'Hold',
            justification: 'Could not generate a specific prediction at this time due to a technical issue. Please consider general market conditions.',
            disclaimer: "This is an AI-generated prediction and not financial advice. It is for informational purposes only. Always do your own research and consult with a qualified financial advisor before making any investment decisions.",
        }
    }
  }
);
