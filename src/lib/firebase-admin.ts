import * as admin from 'firebase-admin';

// This configuration is for the SERVER-SIDE only.
// It uses environment variables that are only available on the server.
// Removing the try-catch block to ensure any initialization error is not hidden.

if (!admin.apps.length) {
    // When running on Google Cloud (like Cloud Run), the SDK can often discover credentials automatically.
    // Providing the projectId can help in environments where it's not implicitly available.
    admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
}

export const adminDb = admin.firestore();
