
import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// Initialize Firebase Admin SDK, but only if it's not already initialized.
// This uses the standard [DEFAULT] app instance and is the simplest, most robust approach.
if (getApps().length === 0) {
  initializeApp();
}

export async function POST(request: Request) {
    const { code, userId } = await request.json();

    if (!code || !userId) {
        return NextResponse.json({ success: false, message: 'Coupon code and user ID are required.' }, { status: 400 });
    }

    try {
        const db = getFirestore(); // Get firestore from the default app instance

        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists()) {
            return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
        }
        const user = userSnap.data() as User;

        if (user.role !== 'basic') {
            return NextResponse.json({ success: false, message: 'Your account is already upgraded.' }, { status: 400 });
        }

        const couponsCollection = db.collection('coupons');
        const q = couponsCollection.where('code', '==', code.trim()).limit(1);
        const couponSnapshot = await q.get();

        if (couponSnapshot.empty) {
            return NextResponse.json({ success: false, message: 'Invalid coupon code.' }, { status: 404 });
        }

        const couponDoc = couponSnapshot.docs[0];
        const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

        if (coupon.isUsed) {
            return NextResponse.json({ success: false, message: 'This coupon has already been used.' }, { status: 400 });
        }

        // Use a batch to perform both updates atomically.
        const batch = db.batch();
        
        // 1. Update the user's role
        batch.update(userRef, { role: coupon.role });
        
        // 2. Mark the coupon as used
        const couponRef = db.collection('coupons').doc(coupon.id);
        batch.update(couponRef, { isUsed: true, usedBy: userId });
        
        await batch.commit();
        
        return NextResponse.json({
          success: true,
          message: `Your account has been successfully upgraded to ${coupon.role}!`,
          newRole: coupon.role,
        });

      } catch (error) {
        console.error('API /redeem-coupon error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        return NextResponse.json({ success: false, message: `An unexpected server error occurred: ${errorMessage}` }, { status: 500 });
      }
}
