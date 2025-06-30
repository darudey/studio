/**
 * @fileOverview This file configures the Genkit AI instance.
 */
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin.
// By not providing an explicit API key, it will use Application Default Credentials,
// the standard for server-side authentication.
// We are disabling tracing to prevent conflicts with the Firebase Admin SDK's
// own telemetry, which appears to be the root cause of the authentication errors.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  enableTracing: false,
});