'use server';
/**
 * @fileOverview A Genkit flow for redeeming a coupon to upgrade a user's role.
 * This function uses the Firebase Admin SDK to act as a trusted server environment,
 * bypassing client-side security rules to securely update user roles and coupons.
 *
 * - redeemCoupon - A function that handles the coupon redemption process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { adminDb } from '@/lib/firebase-admin';
import type { Coupon, User, UserRole } from '@/types';

// Define input and output Zod schemas for the flow
// These are not exported to comply with 'use server' constraints.
const RedeemCouponInputSchema = z.object({
  code: z.string().describe('The coupon code to redeem.'),
  userId: z.string().describe('The ID of the user redeeming the coupon.'),
});

const RedeemCouponOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  newRole: z.nativeEnum(UserRole).optional(),
});

// Define the type for the client-side call
export type RedeemCouponInput = z.infer<typeof RedeemCouponInputSchema>;
export type RedeemCouponOutput = z.infer<typeof RedeemCouponOutputSchema>;


// This is the exported function the client will call.
export async function redeemCoupon(input: RedeemCouponInput): Promise<RedeemCouponOutput> {
  return redeemCouponFlow(input);
}


// The actual Genkit flow that runs on the server
const redeemCouponFlow = ai.defineFlow(
  {
    name: 'redeemCouponFlow',
    inputSchema: RedeemCouponInputSchema,
    outputSchema: RedeemCouponOutputSchema,
  },
  async (input) => {
    const { code, userId } = input;

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
        return { success: false, message: 'Coupon code cannot be empty.' };
    }
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        return { success: false, message: 'User ID cannot be empty.' };
    }

    try {
      // The admin SDK bypasses Firestore security rules, acting as a trusted server environment.
      
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
      console.error('Coupon redemption flow failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: `An unexpected server error occurred. Details: ${errorMessage}` };
    }
  }
);
