/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// By not providing an explicit API key, it will use Application Default Credentials,
// the standard for server-side authentication, which prevents conflicts with
// other server-side libraries like the Firebase Admin SDK.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
