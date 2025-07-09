
'use client';

import {
  LayoutGrid,
  Umbrella,
  Headphones,
  Lamp,
  Package,
  Bean,
  PenSquare,
  Cookie,
  ShoppingBasket,
  Shirt,
  Brush, // Replaced custom icon with a cleaner one from Lucide
} from 'lucide-react';
import React from 'react';
import { cn } from './utils';

const ChowminIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M60 46 H4 C2.89543 46 2 46.8954 2 48 V52 C2 53.1046 2.89543 54 4 54 H60 C61.1046 54 62 53.1046 62 52 V48 C62 46.8954 61.1046 46 60 46 Z" />
      <path d="M12 45 C 8 38, 16 34, 20 38" />
      <path d="M24 45 C 20 38, 28 34, 32 38" />
      <path d="M36 45 C 32 38, 40 34, 44 38" />
      <path d="M48 45 C 44 38, 52 34, 56 38" />
      <path d="M18 41 C 14 34, 22 30, 26 34" />
      <path d="M30 41 C 26 34, 34 30, 38 34" />
      <path d="M42 41 C 38 34, 46 30, 50 34" />
      <path d="M25 36 L30 42" strokeWidth="2" />
      <path d="M40 36 L45 42" strokeWidth="2" />
    </svg>
  );

const PujaIcon = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" // Increased stroke width for better visibility
        strokeLinecap="round" 
        strokeLinejoin="round" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M9 17V8" />
        <path d="M9 6c.5-1.5 2-2 2-2" />
        <path d="M13 17V10" />
        <path d="M13 8c.5-1.5 2-2 2-2" />
        <path d="M5 20h14" />
        <path d="M8 20a4 4 0 0 1 8 0" />
    </svg>
);


const categoryIcons: { [key: string]: React.ElementType } = {
  'all': LayoutGrid,
  'monsoon': Umbrella,
  'electronics': Headphones,
  'beauty': Brush, // Using cleaner icon
  'decor': Lamp,
  'fashion': Shirt,
  'chowmin': ChowminIcon,
  'cosmetics': Brush, // Using cleaner icon
  'general': Package,
  'puja items': PujaIcon,
  'rice': Bean,
  'stationary': PenSquare,
  'kurkure': Cookie,
  'daily essentials': ShoppingBasket,
};

export const getIconForCategory = (category: string): React.ElementType => {
    const lowerCategory = (category || 'uncategorized').toLowerCase();
    if (categoryIcons[lowerCategory]) {
        return categoryIcons[lowerCategory];
    }
    for (const key in categoryIcons) {
        if (lowerCategory.includes(key)) {
            return categoryIcons[key];
        }
    }
    return Package; // Default fallback icon
};

// Component to render the icon as a default image
// Updated for better visual appearance: more solid background and clearer icon color.
export const CategoryIconAsImage = ({ category, className }: { category: string, className?: string }) => {
    const Icon = getIconForCategory(category);
    return (
        <div className={cn("flex items-center justify-center w-full h-full bg-muted rounded-md", className)}>
            <Icon className="w-1/2 h-1/2 text-slate-500" />
        </div>
    );
};
