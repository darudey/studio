'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { UserRole, type Coupon, type User } from '@/types';

// These schemas are for input validation within the server action.
const RedeemCouponInputSchema = z.object({
  code: z.string().describe('The coupon code to redeem.'),
  userId: z.string().describe('The ID of the user redeeming the coupon.'),
});

export type RedeemCouponInput = z.infer<typeof RedeemCouponInputSchema>;

export interface RedeemCouponOutput {
  success: boolean;
  message: string;
  newRole?: UserRole;
};

// This is the exported server action the client will call.
export async function redeemCoupon(input: RedeemCouponInput): Promise<RedeemCouponOutput> {
  const validatedInput = RedeemCouponInputSchema.safeParse(input);

  if (!validatedInput.success) {
      return { success: false, message: 'Invalid input.' };
  }
  
  const { code, userId } = validatedInput.data;

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
    console.error('Coupon redemption failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, message: `An unexpected server error occurred. Details: ${errorMessage}` };
  }
}
