
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { type Coupon, type User } from '@/types';

// Using a named app instance helps to avoid conflicts with other
// Google Cloud services that might be auto-initialized (like Genkit).
const getAdminDb = () => {
  const APP_NAME = 'firebase-admin-redeem-coupon-app';
  
  const existingApp = admin.apps.find(app => app?.name === APP_NAME);

  if (existingApp) {
    return existingApp.firestore();
  }

  try {
    // Initialize a new app if one doesn't exist.
    const newApp = admin.initializeApp({
        // Using projectId should be sufficient if Application Default Credentials
        // are configured correctly in the environment.
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }, APP_NAME);
    return newApp.firestore();
  } catch (error) {
    // Log the detailed error for server-side debugging.
    console.error("Firebase Admin SDK initialization failed:", error);
    // Throw a generic but informative error.
    throw new Error("Server configuration error: Could not initialize Firebase Admin services.");
  }
};


// Schema for the incoming request body
const RedeemCouponInputSchema = z.object({
  code: z.string().min(1, 'Coupon code cannot be empty.'),
  userId: z.string().min(1, 'User ID cannot be empty.'),
});

export async function POST(request: NextRequest) {
  try {
    // Get the isolated Firestore database instance.
    const adminDb = getAdminDb();
    
    const body = await request.json();
    const validatedInput = RedeemCouponInputSchema.safeParse(body);

    if (!validatedInput.success) {
      return NextResponse.json({ success: false, message: 'Invalid input.' }, { status: 400 });
    }
    
    const { code, userId } = validatedInput.data;
    
    // The admin SDK bypasses Firestore security rules, acting as a trusted server environment.
    
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: `An unexpected server error occurred. Details: ${errorMessage}` }, { status: 500 });
  }
}
