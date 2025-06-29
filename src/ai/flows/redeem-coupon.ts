'use server';
/**
 * @fileOverview A Genkit flow for redeeming a coupon to upgrade a user's role.
 * This flow uses the Firebase Admin SDK to act as a trusted server environment,
 * bypassing client-side security rules to securely update user roles and coupons.
 *
 * - redeemCoupon - A function that handles the coupon redemption process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';
import type { Coupon, User, UserRole } from '@/types';

const RedeemCouponInputSchema = z.object({
  code: z.string().min(1, { message: 'Coupon code cannot be empty.' }),
  userId: z.string().min(1, { message: 'User ID cannot be empty.' }),
});

const RedeemCouponOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newRole: z.enum(['basic', 'wholesaler', 'developer', 'shop-owner']).optional(),
});


export async function redeemCoupon(input: z.infer<typeof RedeemCouponInputSchema>): Promise<z.infer<typeof RedeemCouponOutputSchema>> {
  return redeemCouponFlow(input);
}

const redeemCouponFlow = ai.defineFlow(
  {
    name: 'redeemCouponFlow',
    inputSchema: RedeemCouponInputSchema,
    outputSchema: RedeemCouponOutputSchema,
  },
  async ({ code, userId }) => {
    try {
      // The admin SDK bypasses Firestore security rules, so this flow acts as a trusted server environment.
      
      // 1. Find the user
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
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
      console.error('Coupon redemption flow failed with admin SDK:', error);
      // It's better not to expose detailed internal errors to the client.
      return { success: false, message: 'An unexpected server error occurred. Please try again later.' };
    }
  }
);
