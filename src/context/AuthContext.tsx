"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { getUserById, createUserProfile, updateUser } from '@/lib/data';
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
  upgradeToWholesaler: (code: string) => Promise<boolean>;
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
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userProfile = await getUserById(authUser.uid);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const authUser = userCredential.user;
        
        const role: UserRole = email.toLowerCase() === 'dev@example.com' ? 'developer' : 'basic';

        const newUser: User = { id: authUser.uid, name, email, phone, address, role };
        await createUserProfile(newUser);
        setUser(newUser); // Set user immediately after profile creation
        return { success: true };

     } catch (error) {
        return { success: false, error: mapFirebaseError(error as AuthError) };
     }
  };

  const upgradeToWholesaler = async (code: string) => {
    if (user && code === 'WHOLESALE123' && user.role === 'basic') {
      const updatedUser: User = { ...user, role: 'wholesaler' as UserRole };
      await updateUser(updatedUser);
      setUser(updatedUser);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, upgradeToWholesaler }}>
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
