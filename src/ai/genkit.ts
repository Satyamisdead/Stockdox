
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // By removing the default model, we let Genkit pick a compatible one
  // based on the flow's requirements or its own defaults.
});
