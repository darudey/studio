"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const getHintForCategory = (category: string): string => {
    const catLower = category.toLowerCase();
    if (catLower.includes('all')) return 'shopping cart';
    if (catLower.includes('fruit') || catLower.includes('vegetable') || catLower.includes('food')) return 'food health';
    if (catLower.includes('electronic') || catLower.includes('mobile') || catLower.includes('gadget')) return 'electronics gadgets';
    if (catLower.includes('fashion') || catLower.includes('cloth')) return 'fashion clothing';
    if (catLower.includes('home') || catLower.includes('appliance')) return 'home appliances';
    if (catLower.includes('beauty')) return 'beauty cosmetics';
    if (catLower.includes('toy') || catLower.includes('baby')) return 'toys baby';
    if (catLower.includes('sport')) return 'sports equipment';
    const hint = catLower.split(' ')[0];
    return hint.length > 2 ? hint : category;
}


export default function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  const allCategories = ["All", ...categories];

  return (
    <div className="py-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategorySelect(category)}
            className={cn(
              "flex flex-col items-center text-center group transition-transform duration-200 ease-in-out hover:scale-105",
              selectedCategory === category && "scale-105"
            )}
          >
            <div className={cn(
              "w-16 h-16 bg-gradient-to-b from-cyan-100 to-blue-300 rounded-xl flex items-center justify-center p-2 shadow-md transition-all duration-200",
              selectedCategory === category ? "ring-2 ring-primary ring-offset-2" : "group-hover:shadow-cyan-200/50 group-hover:shadow-lg"
            )}>
              <div className="relative w-full h-full">
                <Image
                  src={`https://placehold.co/64x64.png`}
                  alt={category}
                  fill
                  className="object-contain"
                  sizes="64px"
                  data-ai-hint={getHintForCategory(category)}
                />
              </div>
            </div>
            <span className={cn(
                "mt-1.5 text-xs font-medium text-center break-words w-full",
                selectedCategory === category ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                )}>
                {category}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
