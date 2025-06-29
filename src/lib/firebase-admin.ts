import * as admin from 'firebase-admin';

// This configuration is for the SERVER-SIDE only.
// It uses environment variables that are only available on the server.

try {
    if (!admin.apps.length) {
        // When running on Google Cloud (like Cloud Run), the credentials are automatically available.
        // For local development, you need to set up the GOOGLE_APPLICATION_CREDENTIALS environment variable.
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
} catch (error) {
    console.error('Firebase Admin initialization error', error);
}

export const adminDb = admin.firestore();
