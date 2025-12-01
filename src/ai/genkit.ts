import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-pro', // Use a stable and valid model
});
