
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { getCategorySettings } from '@/lib/data';
import { Category } from '@/types';

interface CategorySettingsContextType {
  settingsMap: Record<string, string>;
  refreshCategorySettings: () => Promise<void>;
  loading: boolean;
}

const CategorySettingsContext = createContext<CategorySettingsContextType | undefined>(undefined);

export const CategorySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const settingsData = await getCategorySettings();
      const newSettingsMap = settingsData.reduce((acc, setting) => {
        if (setting.imageUrl) {
            acc[setting.id] = setting.imageUrl;
        }
        return acc;
      }, {} as Record<string, string>);
      setSettingsMap(newSettingsMap);
    } catch (error) {
      console.error("Failed to fetch category settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <CategorySettingsContext.Provider value={{ settingsMap, refreshCategorySettings: fetchSettings, loading }}>
      {children}
    </CategorySettingsContext.Provider>
  );
};

export const useCategorySettings = () => {
  const context = useContext(CategorySettingsContext);
  if (context === undefined) {
    throw new Error('useCategorySettings must be used within a CategorySettingsProvider');
  }
  return context;
};
