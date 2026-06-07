
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = "AIzaSyCw1LrhLFPYwPasxlVP6pkagbF3kdSwXkA";
}

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // We explicitly set a stable default model to avoid "Not Found" errors.
  model: 'googleai/gemini-flash-latest',
});
