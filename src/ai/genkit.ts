import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [
    googleAI({
      tools: ['googleSearch'],
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
