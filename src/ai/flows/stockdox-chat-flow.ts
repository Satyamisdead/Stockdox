'use server';
/**
 * @fileOverview A conversational AI flow for Stockdox, embodying the "Stockdox AI" persona.
 *
 * - stockdoxChat - A function that handles chat interactions.
 * - StockdoxChatInput - The input type for the stockdoxChat function.
 * - StockdoxChatOutput - The return type for the stockdoxChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StockdoxChatInputSchema = z.object({
  message: z.string().describe('The user message to the chatbot.'),
});
export type StockdoxChatInput = z.infer<typeof StockdoxChatInputSchema>;

// Simplified schema to ensure basic chat works first.
const StockdoxChatOutputSchema = z.object({
  answer: z.string().describe("The clear human-readable answer."),
});
export type StockdoxChatOutput = z.infer<typeof StockdoxChatOutputSchema>;


export async function stockdoxChat(input: StockdoxChatInput): Promise<StockdoxChatOutput> {
  return stockdoxChatFlow(input);
}

const stockdoxChatPrompt = ai.definePrompt({
  name: 'stockdoxChatPrompt',
  input: {schema: StockdoxChatInputSchema},
  output: {
    format: 'json',
    schema: StockdoxChatOutputSchema,
  },
  prompt: `You are **Stockdox AI**, an accurate, safe, and structured finance assistant built for the StockDox frontend. 
Your answers must ALWAYS follow the rules below. Never break formatting, never hallucinate market data.

Your goal is to provide a helpful and conversational response in English.

Keep explanations simple, clean, and practical.

Always include a disclaimer: "This is for informational purposes only. Please consult a registered financial advisor."

User's message: {{{message}}}
`,
});

const stockdoxChatFlow = ai.defineFlow(
  {
    name: 'stockdoxChatFlow',
    inputSchema: StockdoxChatInputSchema,
    outputSchema: StockdoxChatOutputSchema,
  },
  async (input) => {
    const { output } = await stockdoxChatPrompt(input);
    if (!output) {
      // This is a fallback, but the improved prompt should prevent this.
      return {
        answer: "I'm sorry, I encountered a technical difficulty. Please try again.",
      };
    }
    return output;
  }
);
