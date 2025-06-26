"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { users as mockUsers } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'role'>) => boolean;
  upgradeToWholesaler: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Simulate checking for a logged-in user in local storage
    const storedUser = localStorage.getItem('wholesale-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (email: string) => {
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('wholesale-user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wholesale-user');
  };
  
  const register = (userData: Omit<User, 'id' | 'role'>) => {
    const existingUser = mockUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (existingUser) {
        return false; // User already exists
    }
    const newUser: User = {
        ...userData,
        id: (mockUsers.length + 1).toString(),
        role: 'basic',
    };
    mockUsers.push(newUser);
    setUser(newUser);
    localStorage.setItem('wholesale-user', JSON.stringify(newUser));
    return true;
  };

  const upgradeToWholesaler = (code: string) => {
    // Simple mock upgrade logic
    if (user && code === 'WHOLESALE123' && user.role === 'basic') {
      const updatedUser = { ...user, role: 'wholesaler' as UserRole };
      setUser(updatedUser);
      // Update the user in our mock data array
      const userIndex = mockUsers.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
          mockUsers[userIndex] = updatedUser;
      }
      localStorage.setItem('wholesale-user', JSON.stringify(updatedUser));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, upgradeToWholesaler }}>
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
