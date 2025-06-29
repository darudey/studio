import admin from 'firebase-admin';

// This configuration is for the SERVER-SIDE only.
// It uses environment variables that are only available on the server.

try {
    if (!admin.apps.length) {
        // When running on Google Cloud (like Cloud Run), credentials can often be discovered automatically
        // by providing the projectId. This is more robust than relying on GOOGLE_APPLICATION_CREDENTIALS
        // which may not be set in all development environments.
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
} catch (error: any) {
    console.error('Firebase Admin initialization error. This is likely a problem with authentication credentials.', error);
    // Re-throwing the error provides a more direct and helpful message than the subsequent "default app does not exist" error.
    throw new Error(`Failed to initialize Firebase Admin SDK. This is likely a credential issue. The original error was: ${error.message}`);
}

export const adminDb = admin.firestore();
