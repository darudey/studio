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
} from 'lucide-react';
import React from 'react';

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

const CosmeticsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 10.5C13.5 9.67 12.83 9 12 9C11.17 9 10.5 9.67 10.5 10.5V20.5H13.5V10.5Z" fill="#87CEFA" />
      <path d="M10.5 13H9C8.45 13 8 12.55 8 12V11C8 10.45 8.45 10 9 10H12" />
      <path d="M3 16H8V20.5H3V16Z" fill="#E6E6FA" />
      <path d="M3 14H8V16H3V14Z" fill="#A9A9A9" />
      <path d="M4 17H7V19.5H4V17Z" fill="#98FB98" />
      <path d="M15 12H20V20.5H15V12Z" fill="#87CEFA" />
      <path d="M15 10H20V12H15V10Z" fill="#A9A9A9" />
      <path d="M3.5 5.5L4 6.5L4.5 5.5L4 4.5L3.5 5.5Z" fill="#FFD700" stroke="none" />
      <path d="M19.5 5.5L20 6.5L20.5 5.5L20 4.5L19.5 5.5Z" fill="#FFD700" stroke="none" />
      <path d="M6 8.5L6.5 9.5L7 8.5L6.5 7.5L6 8.5Z" fill="#FFD700" stroke="none" />
    </g>
  </svg>
);

const PujaIcon = () => (
    <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.5" 
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
  'beauty': CosmeticsIcon,
  'decor': Lamp,
  'fashion': Shirt,
  'chowmin': ChowminIcon,
  'cosmetics': CosmeticsIcon,
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
export const CategoryIconAsImage = ({ category, className }: { category: string, className?: string }) => {
    const Icon = getIconForCategory(category);
    return (
        <div className={`flex items-center justify-center w-full h-full bg-muted/30 rounded-md ${className}`}>
            <Icon className="w-1/2 h-1/2 text-muted-foreground/60" />
        </div>
    );
};
