"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { getUserByEmail, addUser, getUserById, updateUser } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'role'>) => Promise<boolean>;
  upgradeToWholesaler: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const storedUserId = localStorage.getItem('wholesale-user-id');
      if (storedUserId) {
        const foundUser = await getUserById(storedUserId);
        setUser(foundUser);
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  const login = async (email: string) => {
    const foundUser = await getUserByEmail(email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('wholesale-user-id', foundUser.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wholesale-user-id');
  };
  
  const register = async (userData: Omit<User, 'id' | 'role'>) => {
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
        return false; // User already exists
    }
    
    // Special role for the developer account
    const role = userData.email.toLowerCase() === 'dev@example.com' ? 'developer' : 'basic';

    const newUserBase = { ...userData, role };
    const newUser = await addUser(newUserBase);

    setUser(newUser);
    localStorage.setItem('wholesale-user-id', newUser.id);
    return true;
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
