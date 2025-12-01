
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {google} from 'googleapis';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // By removing the default model, we let Genkit pick a compatible one.
});
