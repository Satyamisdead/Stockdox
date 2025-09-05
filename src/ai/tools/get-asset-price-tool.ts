
'use server';
/**
 * @fileOverview A Genkit tool for fetching the price of a stock or cryptocurrency.
 *
 * - getAssetPrice - A tool that retrieves the price for a given asset symbol.
 */
import { ai } from '@/ai/genkit';
import { placeholderAssets } from '@/lib/placeholder-data';
import { fetchCryptoDetails } from '@/services/coingeckoService';
import { fetchStockDetails } from '@/services/finnhubService';
import { z } from 'zod';

const GetAssetPriceInputSchema = z.object({
  symbol: z.string().describe('The stock ticker or cryptocurrency symbol (e.g., "AAPL", "BTC").'),
});

const GetAssetPriceOutputSchema = z.object({
    price: z.number().optional(),
    name: z.string().optional(),
    symbol: z.string(),
    error: z.string().optional(),
});

export const getAssetPrice = ai.defineTool(
  {
    name: 'getAssetPrice',
    description: 'Get the current price of a specific stock or cryptocurrency.',
    inputSchema: GetAssetPriceInputSchema,
    outputSchema: GetAssetPriceOutputSchema,
  },
  async (input) => {
    const symbol = input.symbol.toUpperCase();
    console.log(`[getAssetPrice Tool] Received request for symbol: ${symbol}`);

    const assetInfo = placeholderAssets.find(
      (a) => a.symbol.toUpperCase() === symbol
    );

    if (!assetInfo) {
      console.log(`[getAssetPrice Tool] Asset not found for symbol: ${symbol}`);
      return { symbol, error: `Asset with symbol '${symbol}' not found.` };
    }

    try {
      let details;
      if (assetInfo.type === 'stock') {
        console.log(`[getAssetPrice Tool] Fetching stock details for ${symbol}`);
        details = await fetchStockDetails(assetInfo.symbol);
      } else { // crypto
        console.log(`[getAssetPrice Tool] Fetching crypto details for ${assetInfo.id}`);
        details = await fetchCryptoDetails(assetInfo.id);
      }

      if (details?.price !== undefined) {
        console.log(`[getAssetPrice Tool] Successfully fetched price for ${symbol}: ${details.price}`);
        return {
          price: details.price,
          name: details.name || assetInfo.name,
          symbol: assetInfo.symbol,
        };
      } else {
        console.warn(`[getAssetPrice Tool] Could not retrieve price for ${symbol}.`);
        return { symbol, error: `Could not retrieve price for ${assetInfo.name}.` };
      }
    } catch (e) {
      console.error(`[getAssetPrice Tool] Error fetching price for ${symbol}:`, e);
      return {
        symbol,
        error: `An unexpected error occurred while fetching the price for ${assetInfo.name}.`,
      };
    }
  }
);
