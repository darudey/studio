
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
import Image from 'next/image';

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
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Incense sticks */}
      <path d="M10 20v-8" />
      <path d="M7 20v-5" />
      <path d="M13 20v-5" />
      <path d="M10 9a1.5 1.5 0 0 0-3-2" />
      <path d="M7 12a1.5 1.5 0 0 0-3-2" />
      <path d="M13 12a1.5 1.5 0 0 0-3-2" />
      
      {/* Diya (Oil Lamp) */}
      <path d="M17 16c0 1.5-1.5 3-3.5 3s-3.5-1.5-3.5-3 1.5-3 3.5-3" />
      <path d="M17 16a2 2 0 1 0 4 0c0-2-3-4-3-4s-1 2-1 4Z" />
    </svg>
);

const RiceIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 23H4C2.89543 23 2 22.1046 2 21V7C2 4.79086 3.79086 3 6 3H18C20.2091 3 22 4.79086 22 7V21C22 22.1046 21.1046 23 20 23Z" fill="#D2B48C"/>
      <path d="M19 23C19.5523 23 20 22.5523 20 22V8C20 6.34315 18.6569 5 17 5H7C5.34315 5 4 6.34315 4 8V22C4 22.5523 4.44772 23 5 23H19Z" fill="#C6A682"/>
      <path d="M2 7H22V9H2V7Z" fill="#2F3542"/>
      <path d="M2 7L3 8L4 7L5 8L6 7L7 8L8 7L9 8L10 7L11 8L12 7L13 8L14 7L15 8L16 7L17 8L18 7L19 8L20 7L21 8L22 7" stroke="#9A8C78" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="5" y="10" width="14" height="10" rx="1" fill="#2F3542"/>
      <path d="M16 12C16 11.1716 12.8284 10.5 12 10.5C11.1716 10.5 8 11.1716 8 12" stroke="white" strokeWidth="1" strokeLinecap="round"/>
      <text x="12" y="15.5" textAnchor="middle" fontFamily="sans-serif" fontSize="3" fill="white" fontWeight="bold">Rice</text>
      <ellipse cx="9" cy="17.5" rx="0.7" ry="0.4" fill="white" transform="rotate(30 9 17.5)"/>
      <ellipse cx="10.5" cy="17.5" rx="0.7" ry="0.4" fill="white" transform="rotate(-20 10.5 17.5)"/>
      <ellipse cx="12" cy="17.5" rx="0.7" ry="0.4" fill="white" transform="rotate(10 12 17.5)"/>
      <ellipse cx="13.5" cy="17.5" rx="0.7" ry="0.4" fill="white" transform="rotate(40 13.5 17.5)"/>
      <ellipse cx="15" cy="17.5" rx="0.7" ry="0.4" fill="white" transform="rotate(-10 15 17.5)"/>
      <ellipse cx="8.5" cy="19" rx="0.7" ry="0.4" fill="white" transform="rotate(-15 8.5 19)"/>
      <ellipse cx="10" cy="19" rx="0.7" ry="0.4" fill="white" transform="rotate(25 10 19)"/>
      <ellipse cx="11.5" cy="19" rx="0.7" ry="0.4" fill="white" transform="rotate(-5 11.5 19)"/>
      <ellipse cx="13" cy="19" rx="0.7" ry="0.4" fill="white" transform="rotate(15 13 19)"/>
      <ellipse cx="14.5" cy="19" rx="0.7" ry="0.4" fill="white" transform="rotate(35 14.5 19)"/>
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
  'rice': RiceIcon,
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

export const CategoryIconAsImage = ({ category, imageUrl, className }: { category: string; imageUrl?: string | null; className?: string }) => {
    if (imageUrl) {
      return (
        <div className={cn("relative w-full h-full", className)}>
          <Image
            src={imageUrl}
            alt={`${category} default image`}
            fill
            className="object-cover rounded-md"
          />
        </div>
      );
    }
  
    const Icon = getIconForCategory(category);
    return (
      <div className={cn("flex items-center justify-center w-full h-full bg-muted rounded-md", className)}>
        <Icon className="w-1/2 h-1/2 text-slate-500" />
      </div>
    );
  };

    