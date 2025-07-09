
"use client";

import { Product } from "@/types";
import Image from "next/image";
import { CategoryIconAsImage } from "@/lib/icons";

interface SearchSuggestionsProps {
  suggestions: Product[];
  onSuggestionClick: (productId: string) => void;
}

export default function SearchSuggestions({ suggestions, onSuggestionClick }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full mt-1 w-full rounded-md bg-background border shadow-lg z-50 max-h-72 overflow-y-auto">
      <div className="p-1 space-y-1">
        {suggestions.map((product) => {
          const imageUrl = product.images?.[0];
          const isPlaceholder = !imageUrl;
          return (
            <div
              key={product.id}
              className="p-1 hover:bg-muted cursor-pointer flex items-center gap-2 rounded-md border"
              onMouseDown={(e) => {
                e.preventDefault();
                onSuggestionClick(product.id);
              }}
            >
              <div className="relative h-8 w-8 flex-shrink-0">
                {isPlaceholder ? (
                  <CategoryIconAsImage category={product.category} />
                ) : (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-md"
                    data-ai-hint={product.dataAiHint}
                  />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-[11px] leading-tight truncate">{product.name}</p>
                  <p className="text-[9px] text-muted-foreground">in {product.category}</p>
              </div>
            </div>
          )}
        )}
      </div>
    </div>
  );
}
