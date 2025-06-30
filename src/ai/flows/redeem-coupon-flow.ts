'use server';
/**
 * @fileOverview A Genkit flow for redeeming an upgrade coupon.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeApp, getApps, applicationDefault, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { type Coupon, type User } from '@/types';

// Helper function to get a named, isolated Firebase Admin app instance.
const getFirebaseAdminApp = (): App => {
  const appName = 'coupon-redemption-app-isolated';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return existingApp;
  }
  return initializeApp({
    credential: applicationDefault(),
  }, appName);
};


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
        const { code, userId } = input;
        
        const adminApp = getFirebaseAdminApp();
        const adminDb = getFirestore(adminApp);
        
        // 1. Find the user
        const userRef = adminDb.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists()) {
            return { success: false, message: 'User not found.' };
        }
        const user = userSnap.data() as User;

        if (user.role !== 'basic') {
            return { success: false, message: 'Your account is already upgraded.' };
        }

        // 2. Find the coupon
        const couponsCollection = adminDb.collection('coupons');
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
        const batch = adminDb.batch();

        // Update user role
        batch.update(userRef, { role: coupon.role });

        // Mark coupon as used
        const couponRef = adminDb.collection('coupons').doc(coupon.id);
        batch.update(couponRef, { isUsed: true, usedBy: userId });

        await batch.commit();
        
        return {
          success: true,
          message: `Your account has been successfully upgraded to ${coupon.role}!`,
          newRole: coupon.role,
        };

      } catch (error) {
        console.error('Flow /redeemCoupon error:', error);
        const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
        return { success: false, message: `Server Error: ${errorMessage}` };
      }
  }
);
