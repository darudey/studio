
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { getUserById, createUserProfile } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, AuthError } from 'firebase/auth';

type AuthResult = {
  success: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'role'> & {password: string}) => Promise<AuthResult>;
  redeemUpgradeCode: (code: string) => Promise<{success: boolean; message: string;}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseError = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    default:
      console.error("Unhandled Firebase Auth Error:", error);
      return 'An unexpected error occurred. Please try again.';
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userProfile = await getUserById(authUser.uid);
          setUser(userProfile);
        } catch (dbError) {
          console.error("Failed to fetch user profile:", dbError);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    },
    // Error handler for onAuthStateChanged
    (error) => {
      console.error("Firebase Auth state error:", error);
      setUser(null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await signInWithEmailAndPassword(auth, email.toLowerCase(), password);
      return { success: true };
    } catch (error) {
      return { success: false, error: mapFirebaseError(error as AuthError) };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const register = async (userData: Omit<User, 'id' | 'role'> & {password: string}): Promise<AuthResult> => {
     try {
        const { email, password, name, phone, address } = userData;
        const lowerCaseEmail = email.toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, lowerCaseEmail, password);
        const authUser = userCredential.user;
        
        let role: UserRole = 'basic';
        
        if (lowerCaseEmail === 'dev@example.com' || lowerCaseEmail === 'yollo.sark9tceone@gmail.com') {
          role = 'developer';
        }

        const newUser: User = { 
          id: authUser.uid, 
          name: name || "New User", 
          email: lowerCaseEmail, 
          phone: phone || "", 
          address: address || "", 
          role 
        };
        await createUserProfile(newUser);
        setUser(newUser); // Set user immediately after profile creation
        return { success: true };

     } catch (error) {
        if ((error as AuthError).code) {
          return { success: false, error: mapFirebaseError(error as AuthError) };
        }
        
        console.error("Non-Auth error during registration:", error);
        
        let detailedError = "An unknown error occurred.";
        if (error instanceof Error) {
            detailedError = error.message;
        } else if (typeof error === 'object' && error !== null) {
            detailedError = JSON.stringify(error);
        } else if (error) {
            detailedError = String(error);
        }

        const finalMessage = `Registration failed while saving profile. Please check your Firestore security rules or database setup in the Firebase Console. Details: ${detailedError}`;
        
        return { success: false, error: finalMessage };
     }
  };

  const redeemUpgradeCode = async (code: string): Promise<{success: boolean; message: string;}> => {
    if (!user) {
      return { success: false, message: "You must be logged in to redeem a code." };
    }

    try {
      const response = await fetch('/api/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user.id }),
      });

      // Check if the response is JSON before trying to parse it.
      // If it's not, it's likely an HTML error page from a server crash.
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await response.text();
        console.error("Server returned a non-JSON response:", textError);
        return { success: false, message: "Server configuration error. Check server logs." };
      }
      
      const result = await response.json();

      if (!response.ok) {
        // We received a proper JSON error response from the server.
        return { success: false, message: result.message || "An unknown error occurred during the request." };
      }
      
      if (result.success && result.newRole) {
        setUser(currentUser => {
          if (!currentUser) return null;
          return { ...currentUser, role: result.newRole as UserRole };
        });
      }

      return { success: result.success, message: result.message };

    } catch (error) {
      console.error("Coupon redemption fetch failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown network error occurred.";
      return { success: false, message: errorMessage };
    }
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, redeemUpgradeCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
