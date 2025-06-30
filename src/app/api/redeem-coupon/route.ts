
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// This function ensures Firebase Admin is initialized, but only once per server instance.
function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp();
}

export async function POST(request: Request) {
    try {
        initializeAdminApp();
        const db = getFirestore();

        const { code, userId } = await request.json();

        if (!code || !userId) {
            return NextResponse.json({ success: false, message: 'Coupon code and user ID are required.' }, { status: 400 });
        }

        const couponsQuery = db.collection('coupons').where('code', '==', code.trim()).limit(1);

        // Use a transaction to safely read and then write data.
        // This ensures the entire operation succeeds or fails as a single unit.
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

            // All checks passed. Perform the writes within the transaction.
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
        return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }
}
