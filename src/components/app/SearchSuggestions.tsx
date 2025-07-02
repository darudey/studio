"use client";

import { Product } from "@/types";
import { Search } from "lucide-react";

interface SearchSuggestionsProps {
  suggestions: Product[];
  onSuggestionClick: (productId: string) => void;
}

export default function SearchSuggestions({ suggestions, onSuggestionClick }: SearchSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full mt-2 w-full rounded-md bg-background border shadow-lg z-50">
      <ul className="py-1">
        {suggestions.map((product) => (
          <li
            key={product.id}
            className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center gap-2"
            onMouseDown={(e) => { // use onMouseDown to fire before onBlur on the input
              e.preventDefault();
              onSuggestionClick(product.id);
            }}
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>{product.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
