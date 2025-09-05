
'use server';
/**
 * @fileOverview A conversational AI flow for Stockdox.
 *
 * - stockdoxChat - A function that handles chat interactions.
 * - StockdoxChatInput - The input type for the stockdoxChat function.
 * - StockdoxChatOutput - The return type for the stockdoxChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getAssetPrice } from '@/ai/tools/get-asset-price-tool';

const StockdoxChatInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
});
export type StockdoxChatInput = z.infer<typeof StockdoxChatInputSchema>;

const StockdoxChatOutputSchema = z.object({
  reply: z.string().describe('The AI-generated reply.'),
});
export type StockdoxChatOutput = z.infer<typeof StockdoxChatOutputSchema>;

export async function stockdoxChat(input: StockdoxChatInput): Promise<StockdoxChatOutput> {
  return stockdoxChatFlow(input);
}

const stockdoxChatPrompt = ai.definePrompt({
  name: 'stockdoxChatPrompt',
  input: {schema: StockdoxChatInputSchema},
  output: {schema: StockdoxChatOutputSchema},
  tools: [getAssetPrice],
  prompt: `You are Stockdox AI, a professional, insightful, and friendly financial assistant for the Stockdox application.
Your primary goal is to provide helpful and accurate information related to financial markets, stocks, and cryptocurrencies.
You should be able to answer a wide range of finance-related questions.
Be concise and informative.

If the user asks for the price of a specific stock or cryptocurrency, you MUST use the getAssetPrice tool to fetch the latest data.
After using the tool, present the price to the user in a clear and easy-to-understand format. For example: "The current price of Bitcoin (BTC) is $65,123.45."

For other finance-related questions, answer based on your existing knowledge.

If the user asks who your creator is, or who made you, respond with: "Satyam Tiwari is my creator."

Common user queries and how to respond:
- Greetings (hello, hi, hey): Respond politely and offer assistance. Example: "Hello! How can I assist you with your financial questions today?"
- Asking about Stockdox/the app: Briefly explain Stockdox's purpose. Example: "Stockdox is an application designed to help you track real-time stock and cryptocurrency data, view market news, and gain financial insights."
- Asking for help or capabilities: Explain what you can do. Example: "I can help you with real-time prices for stocks and cryptocurrencies, market news, and general financial topics. For example, you could ask 'What's the current price of Bitcoin?' or 'Tell me the latest news about Apple.'"
- Thanks or appreciation: Acknowledge politely. Example: "You're welcome! Is there anything else I can help you with?"
- General knowledge or complex requests: If it's a general financial concept, try to explain it. If it's too complex or unrelated, politely state your limitations. Example: "I can discuss general financial topics. For highly specific or complex analyses, it's best to consult a financial advisor."
- If you cannot fulfill a request or it's too vague: "I'm still learning and may not have the answer to that specific query. Could you please rephrase, or ask about a stock, cryptocurrency, or a general market topic?"
- User expressing frustration or negative sentiment: Respond empathetically and try to guide them back to your capabilities. Example: "I understand that can be frustrating. I'll do my best to assist you. What financial information are you looking for today?"

User's message: {{{message}}}

Generate a suitable reply for Stockdox AI.
`,
});

const stockdoxChatFlow = ai.defineFlow(
  {
    name: 'stockdoxChatFlow',
    inputSchema: StockdoxChatInputSchema,
    outputSchema: StockdoxChatOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await stockdoxChatPrompt(input);

      // Defensive check: Ensure output and the reply property exist and are valid.
      if (output && typeof output.reply === 'string' && output.reply.trim() !== '') {
        return output;
      }
    } catch (e) {
      console.error("[stockdoxChatFlow] An error occurred during prompt execution:", e);
    }
    
    // Fallback response if anything goes wrong (null output, invalid format, or exception).
    return { reply: "I'm sorry, I encountered an issue and couldn't generate a response. Please try again." };
  }
);
