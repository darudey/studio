"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid, Umbrella, Headphones, Gem, Lamp, Package, Popcorn } from "lucide-react";
import React from 'react';

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const categoryIcons: { [key: string]: React.ElementType } = {
  'all': LayoutGrid,
  'monsoon': Umbrella,
  'electronics': Headphones,
  'beauty': Gem,
  'decor': Lamp,
  'fashion': Popcorn,
  // Add more specific mappings as needed
};

const getIconForCategory = (category: string): React.ElementType => {
    const lowerCategory = category.toLowerCase();
    for (const key in categoryIcons) {
        if (lowerCategory.includes(key)) {
            return categoryIcons[key];
        }
    }
    return Package; // Default fallback icon
};


export default function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  const allCategories = ["All", ...categories];

  return (
    <div className="bg-[hsl(var(--header-background))] px-4 pb-4">
      <div className="flex items-center justify-around text-center">
          {allCategories.slice(0, 5).map((category) => {
            const Icon = getIconForCategory(category);
            return (
                <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className={cn(
                    "flex flex-col items-center justify-center gap-1 text-white w-16 transition-opacity",
                    selectedCategory === category ? "font-bold" : "opacity-80 hover:opacity-100"
                )}
                >
                <Icon className="h-6 w-6 text-blue-300" />
                <span className="text-xs">{category}</span>
                </button>
            )
          })}
      </div>
    </div>
  );
}
