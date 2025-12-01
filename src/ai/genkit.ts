
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // We explicitly set a stable default model to avoid "Not Found" errors.
  model: 'gemini-pro',
});
