'use server';
/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {defineFlow, startFlow} from '@genkit-ai/flow';

// Initialize Genkit with the Google AI plugin, explicitly providing the API key
// to prevent conflicts with the Firebase Admin SDK's default credentials.
export const ai = genkit({
  plugins: [
    firebase(), // Firebase plugin for Genkit
    googleAI({apiKey: process.env.GOOGLE_API_KEY}),
  ],
  logSinks: ['firebase'],
  enableTracing: true,
});
