/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin, explicitly providing an API key
// to prevent authentication conflicts with the Firebase Admin SDK's default credentials.
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY }),
  ],
});
