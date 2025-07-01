"use client";

import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
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
import AnimatedLogo from "./AnimatedLogo";

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
      setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const queryString = searchTerm ? `search=${searchTerm}` : '';
    router.push(`/?${queryString}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setShowSuggestions(false);
    const queryString = suggestion ? `search=${suggestion}` : '';
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
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
             <AnimatedLogo />
          </Link>
        </div>

        <div className="relative flex-1 max-w-2xl">
           <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-full bg-muted pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && <SearchSuggestions suggestions={filteredSuggestions} onSuggestionClick={handleSuggestionClick} />}
            </form>
        </div>

        <div className="flex shrink-0 items-center justify-end space-x-2">
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
        </div>
      </div>
    </header>
  );
}
