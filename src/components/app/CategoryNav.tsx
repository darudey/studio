
"use client";

import { cn } from "@/lib/utils";
import { LayoutGrid } from "lucide-react";
import React from 'react';
import { getIconForCategory } from "@/lib/icons";
import { useSearchParams, useRouter } from 'next/navigation';

interface CategoryNavProps {
  serverCategories: string[];
}

export default function CategoryNav({ serverCategories }: CategoryNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get('category') || 'All';

  const handleCategorySelect = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'All') {
        params.delete('category');
    } else {
        params.set('category', category);
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-[hsl(var(--header-background))] px-2 pb-4 sticky top-16 z-30">
      <div className="flex items-center gap-2">
          {/* Static 'All' button */}
          <button
            onClick={() => handleCategorySelect("All")}
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
              {serverCategories.map((category) => {
                  const Icon = getIconForCategory(category);
                  return (
                    <button
                        key={category}
                        onClick={() => handleCategorySelect(category)}
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
