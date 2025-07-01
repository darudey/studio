
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
    // A simple heuristic to get a keyword
    const hint = catLower.split(' ')[0].replace(/[^a-z]/g, '');
    return hint.length > 2 ? hint : category;
}


export default function CategoryNav({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) {
  const allCategories = ["All", ...categories];

  return (
    <div className="pt-2 pb-1">
      <div className="overflow-x-auto py-3 -mx-4 px-4">
        <div className="inline-grid grid-rows-2 grid-flow-col gap-x-2 gap-y-3">
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              className={cn(
                "flex w-16 flex-col items-center text-center group transition-transform duration-200 ease-in-out hover:scale-105",
                selectedCategory === category && "scale-105"
              )}
            >
              <div className={cn(
                "w-14 h-14 bg-cyan-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-2 shadow-sm transition-all duration-200",
                selectedCategory === category ? "ring-2 ring-primary ring-offset-2" : "group-hover:shadow-md"
              )}>
                <div className="relative w-full h-full">
                  <Image
                    src={`https://placehold.co/56x56.png`}
                    alt={category}
                    fill
                    className="object-contain"
                    sizes="56px"
                    data-ai-hint={getHintForCategory(category)}
                  />
                </div>
              </div>
              <span className={cn(
                  "mt-1.5 w-full break-words text-center text-[11px] leading-tight font-medium h-8 flex items-center justify-center",
                  selectedCategory === category ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                  {category}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
