
"use client";

import Link from "next/link";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import UserNav from "./UserNav";
import ShoppingCartSheet from "./ShoppingCartSheet";
import { useCart } from "@/context/CartContext";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState, useMemo } from "react";
import { getProducts } from "@/lib/data";
import { Product } from "@/types";
import SearchSuggestions from "./SearchSuggestions";

export default function Header() {
  const { user, loading } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    getProducts().then(setAllProducts);
  }, []);

  useEffect(() => {
      // Syncs the search input with the URL's search param
      setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    // Update the URL, which will trigger the page to re-filter
    const currentView = searchParams.get('view');
    const viewQuery = currentView ? `view=${currentView}` : '';
    const searchQuery = searchTerm ? `search=${searchTerm}` : '';
    const queryString = [viewQuery, searchQuery].filter(Boolean).join('&');
    router.push(`/?${queryString}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    // Update the URL. The useEffect above will update the input field's text.
    // This makes the URL the single source of truth for the search.
    const currentView = searchParams.get('view');
    const viewQuery = currentView ? `view=${currentView}` : '';
    const searchQuery = suggestion ? `search=${suggestion}` : '';
    const queryString = [viewQuery, searchQuery].filter(Boolean).join('&');
    router.push(`/?${queryString}`);
  }

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim() || !showSuggestions) {
      return [];
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\\s\\W\\d_]/gi, '');
    const consonantFilter = getConsonants(searchTerm);

    return allProducts
      .filter(product => {
        const nameLower = product.name.toLowerCase();
        // Direct match
        if (nameLower.includes(lowercasedFilter)) {
          return true;
        }
        // Consonant match fallback
        if (consonantFilter.length > 1) {
            const nameConsonants = getConsonants(product.name);
            if (nameConsonants.includes(consonantFilter)) {
                return true;
            }
        }
        return false;
      })
      .slice(0, 10);
  }, [searchTerm, allProducts, showSuggestions]);


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-2">
        <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        
        <div className="relative w-full md:flex-1 md:w-auto">
           <form onSubmit={handleSearchSubmit} className="w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-full bg-muted pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay to allow click on suggestions
                autoComplete="off"
              />
              {showSuggestions && <SearchSuggestions suggestions={filteredSuggestions} onSuggestionClick={handleSuggestionClick} />}
            </form>
        </div>

        <div className="flex flex-shrink-0 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <ShoppingCartSheet>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                   <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">{cartCount}</Badge>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Button>
            </ShoppingCartSheet>

            {loading ? null : user ? (
              <UserNav />
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
