import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-1.5-flash-latest', // Ensure we use a powerful model
});
