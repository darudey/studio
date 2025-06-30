
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// This function gets or initializes a uniquely named Firebase Admin app.
// This is the robust way to avoid conflicts with the client-side Firebase SDK.
function getAdminApp(): App {
    const ADMIN_APP_NAME = 'firebase-admin-coupon-redeem';
    const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
    if (existingApp) {
        return existingApp;
    }
    // Initialize with an empty object to specify the admin app name.
    // It will use Application Default Credentials from the environment.
    return initializeApp({}, ADMIN_APP_NAME);
}

export async function POST(request: Request) {
    try {
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);

        const { code, userId } = await request.json();

        if (!code || !userId) {
            return NextResponse.json({ success: false, message: 'Coupon code and user ID are required.' }, { status: 400 });
        }

        const couponsQuery = db.collection('coupons').where('code', '==', code.trim()).limit(1);

        // Use a transaction for safe, atomic read-and-write operations.
        const newRole = await db.runTransaction(async (transaction) => {
            const couponSnapshot = await transaction.get(couponsQuery);

            if (couponSnapshot.empty) {
                throw new Error("Invalid or already used coupon code.");
            }

            const couponDoc = couponSnapshot.docs[0];
            const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

            if (coupon.isUsed) {
                throw new Error("Invalid or already used coupon code.");
            }

            const userRef = db.collection('users').doc(userId);
            const userSnap = await transaction.get(userRef);

            if (!userSnap.exists) {
                throw new Error("User account not found.");
            }

            const user = userSnap.data() as User;
            if (user.role !== 'basic') {
                throw new Error("This account has already been upgraded.");
            }

            // All checks passed. Perform writes within the transaction.
            transaction.update(userRef, { role: coupon.role });
            transaction.update(couponDoc.ref, { isUsed: true, usedBy: userId });

            return coupon.role;
        });

        return NextResponse.json({
          success: true,
          message: `Your account has been successfully upgraded to ${newRole}!`,
          newRole: newRole,
        });

    } catch (error) {
        console.error('API /redeem-coupon transaction failed:', error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected server error occurred.";
        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
