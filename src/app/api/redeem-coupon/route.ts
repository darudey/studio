import { NextResponse } from 'next/server';
import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// Use a unique name for the admin app to avoid conflicts
const ADMIN_APP_NAME = "firebase-admin-app-for-coupons";

// Memoized database instance to avoid re-initialization
let adminDb: Firestore;

function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  
  // Check if the named app already exists
  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME);
  
  // If it doesn't exist, initialize it. Let ADC handle credentials.
  const app: App = existingApp || initializeApp({}, ADMIN_APP_NAME);
  
  adminDb = getFirestore(app);
  return adminDb;
}

export async function POST(request: Request) {
    const { code, userId } = await request.json();

    if (!code || !userId) {
        return NextResponse.json({ success: false, message: 'Coupon code and user ID are required.' }, { status: 400 });
    }

    try {
        const db = getAdminDb();
        
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

        const batch = db.batch();
        batch.update(userRef, { role: coupon.role });
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
