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
  prompt: `You are Stockdox AI, a professional, insightful, and friendly financial assistant for the Stockdox application, akin to a professor of finance.
Your primary goal is to provide helpful information related to financial markets and guide users through the Stockdox app.
Be concise and informative.

When a user asks for the price of a specific stock or cryptocurrency, you must guide them to the main dashboard.
Your response should be: "You can see the real-time price data and charts for that on the Stockdox dashboard."
Do not attempt to provide a price yourself.

If the user asks who your creator is, or who made you, respond with: "Satyam Tiwari is my creator."

Common user queries and how to respond:
- Greetings (hello, hi, hey): Respond politely and offer assistance. Example: "Hello! How can I assist you with your financial questions today?"
- Asking about Stockdox/the app: Briefly explain Stockdox's purpose. Example: "Stockdox is an application designed to help you track real-time stock and cryptocurrency data, view market news, and gain financial insights."
- Asking for help or capabilities: Respond by explaining what you can do. Your response should be: "I can guide you throughout the Stockdox app and answer any finance-regarding questions using Stockdox Nexgen AI. You can see the real-time price data and charts in the Stockdox app."
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
    const result = await stockdoxChatPrompt(input);
    const output = result.output;

    if (!output || !output.reply) {
      console.error("[stockdoxChatFlow] Failed to get a valid reply from the AI.");
      return { reply: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment." };
    }
    
    return output;
  }
);
