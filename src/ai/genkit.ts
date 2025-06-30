/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import '@genkit-ai/firebase'; // Import for side-effects to register the Firebase plugin

// Initialize Genkit with the Google AI plugin, explicitly providing the API key
// to prevent conflicts with the Firebase Admin SDK's default credentials.
export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
  ],
  logSinks: ['firebase'],
  enableTracing: true,
});
