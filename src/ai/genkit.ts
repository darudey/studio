/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// Using the simplest possible configuration to allow both Genkit and the Firebase Admin SDK
// to use the default application credentials, which should resolve authentication conflicts.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
