'use server';
/**
 * @fileOverview A Genkit flow for redeeming a coupon to upgrade a user's role.
 *
 * - redeemCoupon - A function that handles the coupon redemption process.
 * - RedeemCouponInput - The input type for the redeemCoupon function.
 * - RedeemCouponOutput - The return type for the redeemCoupon function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, getDoc } from 'firebase/firestore';
import type { Coupon, User, UserRole } from '@/types';

const RedeemCouponInputSchema = z.object({
  code: z.string().min(1, { message: 'Coupon code cannot be empty.' }),
  userId: z.string().min(1, { message: 'User ID cannot be empty.' }),
});
export type RedeemCouponInput = z.infer<typeof RedeemCouponInputSchema>;

const RedeemCouponOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newRole: z.enum(['basic', 'wholesaler', 'developer', 'shop-owner']).optional(),
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
  async ({ code, userId }) => {
    try {
      // 1. Find the user
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return { success: false, message: 'User not found.' };
      }
      const user = userSnap.data() as User;

      if (user.role !== 'basic') {
        return { success: false, message: 'Your account is already upgraded.' };
      }

      // 2. Find the coupon
      const couponsCollection = collection(db, 'coupons');
      const q = query(couponsCollection, where('code', '==', code.trim()));
      const couponSnapshot = await getDocs(q);

      if (couponSnapshot.empty) {
        return { success: false, message: 'Invalid coupon code.' };
      }

      const couponDoc = couponSnapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

      if (coupon.isUsed) {
        return { success: false, message: 'This coupon has already been used.' };
      }

      // 3. Perform atomic update using a batch
      const batch = writeBatch(db);

      // Update user role
      batch.update(userRef, { role: coupon.role });

      // Mark coupon as used
      const couponRef = doc(db, 'coupons', coupon.id);
      batch.update(couponRef, { isUsed: true, usedBy: userId });

      await batch.commit();
      
      return {
        success: true,
        message: `Your account has been successfully upgraded to ${coupon.role}!`,
        newRole: coupon.role,
      };

    } catch (error) {
      console.error('Coupon redemption flow failed:', error);
      // It's better not to expose detailed internal errors to the client.
      return { success: false, message: 'An unexpected server error occurred. Please try again later.' };
    }
  }
);
