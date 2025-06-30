
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { initializeApp, getApps, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// Helper function to get a named, isolated Firebase Admin app instance.
// This prevents conflicts with other Google Cloud libraries like Genkit
// which may be trying to manage the default app instance.
const getFirebaseAdminApp = (): App => {
  const appName = 'coupon-redemption-app-isolated';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  // Initialize with an explicit Application Default Credential.
  // This is the most robust way to authenticate on Google Cloud infrastructure
  // and helps prevent conflicts with other libraries.
  return initializeApp({
    credential: applicationDefault(),
  }, appName);
};

// Schema for the incoming request body
const RedeemCouponInputSchema = z.object({
  code: z.string().min(1, 'Coupon code cannot be empty.'),
  userId: z.string().min(1, 'User ID cannot be empty.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedInput = RedeemCouponInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.' }, { status: 400 });
    }
    
    const { code, userId } = validatedInput.data;
    
    const adminApp = getFirebaseAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // 1. Find the user
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
        return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }
    const user = userSnap.data() as User;

    if (user.role !== 'basic') {
        return NextResponse.json({ success: false, message: 'Your account is already upgraded.' }, { status: 400 });
    }

    // 2. Find the coupon
    const couponsCollection = adminDb.collection('coupons');
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

    // 3. Perform atomic update using a batch
    const batch = adminDb.batch();

    // Update user role
    batch.update(userRef, { role: coupon.role });

    // Mark coupon as used
    const couponRef = adminDb.collection('coupons').doc(coupon.id);
    batch.update(couponRef, { isUsed: true, usedBy: userId });

    await batch.commit();
    
    return NextResponse.json({
      success: true,
      message: `Your account has been successfully upgraded to ${coupon.role}!`,
      newRole: coupon.role,
    });

  } catch (error) {
    console.error('API /redeem-coupon error:', error);
    const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
    return NextResponse.json({ success: false, message: `Server Error: ${errorMessage}` }, { status: 500 });
  }
}
