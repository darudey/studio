
'use server';
/**
 * @fileOverview A Genkit flow for redeeming an upgrade coupon.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// Memoized database instance.
// This prevents re-initializing the app on every call in a serverless environment.
let adminDb: Firestore;

function getAdminDb(): Firestore {
  if (adminDb) {
    return adminDb;
  }
  if (getApps().length === 0) {
    initializeApp({
        credential: applicationDefault()
    });
  }
  adminDb = getFirestore();
  return adminDb;
}


const RedeemCouponInputSchema = z.object({
  code: z.string().min(1, 'Coupon code cannot be empty.'),
  userId: z.string().min(1, 'User ID cannot be empty.'),
});
export type RedeemCouponInput = z.infer<typeof RedeemCouponInputSchema>;

const RedeemCouponOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newRole: z.string().optional(),
});
export type RedeemCouponOutput = z.infer<typeof RedeemCouponOutputSchema>;


export async function redeemCoupon(input: RedeemCouponInput): Promise<RedeemCouponOutput> {
  return redeemCouponFlow(input);
}


const redeemCouponFlow = ai.defineFlow(
  {
    name: 'redeemCouponFlow',
    inputSchema: RedeemCouponInputSchema,
    outputSchema: RedeemCouponOutputSchema,
  },
  async (input) => {
    try {
        const db = getAdminDb();
        const { code, userId } = input;
        
        // 1. Find the user
        const userRef = db.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists()) {
            return { success: false, message: 'User not found.' };
        }
        const user = userSnap.data() as User;

        if (user.role !== 'basic') {
            return { success: false, message: 'Your account is already upgraded.' };
        }

        // 2. Find the coupon
        const couponsCollection = db.collection('coupons');
        const q = couponsCollection.where('code', '==', code.trim()).limit(1);
        const couponSnapshot = await q.get();

        if (couponSnapshot.empty) {
            return { success: false, message: 'Invalid coupon code.' };
        }

        const couponDoc = couponSnapshot.docs[0];
        const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

        if (coupon.isUsed) {
            return { success: false, message: 'This coupon has already been used.' };
        }

        // 3. Perform atomic update using a batch
        const batch = db.batch();

        // Update user role
        batch.update(userRef, { role: coupon.role });

        // Mark coupon as used
        const couponRef = db.collection('coupons').doc(coupon.id);
        batch.update(couponRef, { isUsed: true, usedBy: userId });

        await batch.commit();
        
        return {
          success: true,
          message: `Your account has been successfully upgraded to ${coupon.role}!`,
          newRole: coupon.role,
        };

      } catch (error) {
        console.error('Flow /redeemCoupon error:', error);
        const errorMessage = error instanceof Error ? `${error.message}` : String(error);
        return { success: false, message: `An unexpected server error occurred: ${errorMessage}` };
      }
  }
);
