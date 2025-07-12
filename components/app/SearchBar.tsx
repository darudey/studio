
"use client";

import { FormEvent, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProducts } from "@/lib/data";
import { Product } from "@/types";
import { useDebounce } from "use-debounce";
import SearchSuggestions from "./SearchSuggestions";
import { Input } from "../ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        getProducts().then(setAllProducts);
    }, []);

    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
    }, [searchParams]);

    const handleSearchSubmit = (e: FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
            params.set('search', searchTerm);
        } else {
            params.delete('search');
        }
        router.push(`/?${params.toString()}`);
    };

    const handleSuggestionClick = (productId: string) => {
        setSearchTerm(''); // Clear the search term from the input
        setShowSuggestions(false);
        router.push(`/products/${productId}`);
    }

    const filteredSuggestions = useMemo(() => {
        if (!debouncedSearchTerm.trim() || !showSuggestions) {
          return [];
        }
    
        const lowercasedFilter = debouncedSearchTerm.toLowerCase();
        const getConsonants = (str: string) => str.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
        const consonantFilter = getConsonants(debouncedSearchTerm);
    
        return allProducts
          .filter(product => {
            const nameLower = product.name.toLowerCase();
            // Direct match
            if (nameLower.includes(lowercasedFilter)) {
              return true;
            }
            // Consonant match fallback
            if (consonantFilter.length >= 2) {
                const nameConsonants = getConsonants(product.name);
                if (nameConsonants.includes(consonantFilter)) {
                    return true;
                }
            }
            return false;
          })
          .slice(0, 10);
    }, [debouncedSearchTerm, allProducts, showSuggestions]);

    return (
        <div className={cn(
            "relative flex-1 transition-all duration-300 ease-in-out",
            isSearchFocused ? "max-w-2xl" : "max-w-md"
        )}>
            <form onSubmit={handleSearchSubmit}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                    type="search"
                    placeholder="Search products..."
                    className="w-full rounded-md bg-white text-black pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                        setShowSuggestions(true);
                        setIsSearchFocused(true);
                    }}
                    onBlur={() => {
                        // Delay to allow suggestion click
                        setTimeout(() => {
                        setShowSuggestions(false);
                        setIsSearchFocused(false);
                        }, 200);
                    }}
                    autoComplete="off"
                />
                {showSuggestions && <SearchSuggestions suggestions={filteredSuggestions} onSuggestionClick={handleSuggestionClick} />}
            </form>
        </div>
    );
}
