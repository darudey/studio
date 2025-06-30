/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// The @genkit-ai/firebase import has been removed to prevent authentication conflicts
// with the Firebase Admin SDK.

// Initialize Genkit with the Google AI plugin.
// We are removing the firebase log sink to prevent a deep-seated authentication
// conflict between Genkit's plugins and the Firebase Admin SDK.
export const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
  ],
  // logSinks: ['firebase'], // Temporarily disabled to resolve auth conflict.
  enableTracing: false,
});
