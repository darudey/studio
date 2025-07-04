"use client";

import { Product } from "@/types";
import Image from "next/image";

interface SearchSuggestionsProps {
  suggestions: Product[];
  onSuggestionClick: (productId: string) => void;
}

export default function SearchSuggestions({ suggestions, onSuggestionClick }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full mt-1 w-full rounded-md bg-background border shadow-lg z-50 max-h-80 overflow-y-auto">
      <div className="p-1 space-y-1">
        {suggestions.map((product) => (
          <div
            key={product.id}
            className="p-1.5 hover:bg-muted cursor-pointer flex items-center gap-2 rounded-md border"
            onMouseDown={(e) => {
              e.preventDefault();
              onSuggestionClick(product.id);
            }}
          >
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover rounded-md"
                data-ai-hint={product.dataAiHint}
              />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="font-medium text-xs leading-tight truncate">{product.name}</p>
                <p className="text-[10px] text-muted-foreground">in {product.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
