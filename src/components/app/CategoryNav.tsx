
"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, Umbrella, Headphones, Gem, Lamp, Package, Popcorn } from "lucide-react";
import React from 'react';

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

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
      {/* Pump Bottle */}
      <path d="M13.5 10.5C13.5 9.67 12.83 9 12 9C11.17 9 10.5 9.67 10.5 10.5V20.5H13.5V10.5Z" fill="#87CEFA" />
      <path d="M10.5 13H9C8.45 13 8 12.55 8 12V11C8 10.45 8.45 10 9 10H12" />
      
      {/* Jar with label */}
      <path d="M3 16H8V20.5H3V16Z" fill="#E6E6FA" />
      <path d="M3 14H8V16H3V14Z" fill="#A9A9A9" />
      <path d="M4 17H7V19.5H4V17Z" fill="#98FB98" />

      {/* Tube */}
      <path d="M15 12H20V20.5H15V12Z" fill="#87CEFA" />
      <path d="M15 10H20V12H15V10Z" fill="#A9A9A9" />

      {/* Sparkles */}
      <path d="M3.5 5.5L4 6.5L4.5 5.5L4 4.5L3.5 5.5Z" fill="#FFD700" stroke="none" />
      <path d="M19.5 5.5L20 6.5L20.5 5.5L20 4.5L19.5 5.5Z" fill="#FFD700" stroke="none" />
      <path d="M6 8.5L6.5 9.5L7 8.5L6.5 7.5L6 8.5Z" fill="#FFD700" stroke="none" />
    </g>
  </svg>
);


const categoryIcons: { [key: string]: React.ElementType } = {
  'all': LayoutGrid,
  'monsoon': Umbrella,
  'electronics': Headphones,
  'beauty': CosmeticsIcon,
  'decor': Lamp,
  'fashion': Popcorn,
  'chowmin': ChowminIcon,
  'cosmetics': CosmeticsIcon,
  'general': Package,
  'puja items': Package,
};

const getIconForCategory = (category: string): React.ElementType => {
    const lowerCategory = category.toLowerCase();
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


export default function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  return (
    <div className="bg-[hsl(var(--header-background))] px-2 pb-4">
      <div className="flex items-center gap-2">
          {/* Static 'All' button */}
          <button
            onClick={() => onCategorySelect("All")}
            className={cn(
                "flex flex-col shrink-0 items-center justify-center gap-1 w-14 text-blue-800 transition-opacity",
                selectedCategory === "All" ? "font-bold" : "opacity-80 hover:opacity-100"
            )}
            >
            <LayoutGrid className="h-6 w-6" />
            <span className="text-[10px]">All</span>
          </button>

          <div className="h-10 w-px bg-blue-800/20 shrink-0"></div>

          {/* Scrollable categories */}
          <div className="flex-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex items-center gap-4">
              {categories.map((category) => {
                  const Icon = getIconForCategory(category);
                  return (
                    <button
                        key={category}
                        onClick={() => onCategorySelect(category)}
                        className={cn(
                            "flex flex-col items-center justify-center shrink-0 gap-1 w-20 text-blue-800 transition-opacity",
                            selectedCategory === category ? "font-bold" : "opacity-80 hover:opacity-100"
                        )}
                        >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] truncate w-full">{category}</span>
                    </button>
                )}
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
