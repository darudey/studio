"use client";

import Link from "next/link";
import { Search, ShoppingCart, Bell } from "lucide-react";
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
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Header() {
  const { user, loading } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    if (user && ['developer', 'shop-owner'].includes(user.role)) {
      let lastChecked = localStorage.getItem('lastCheckedOrdersTimestamp');

      if (!lastChecked) {
        lastChecked = new Date().toISOString();
        localStorage.setItem('lastCheckedOrdersTimestamp', lastChecked);
      }

      const q = query(collection(db, "orders"), where("date", ">", lastChecked));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setNewOrdersCount(snapshot.size);
      }, (error) => {
        console.error("Error listening for new orders:", error);
      });

      return () => unsubscribe();
    } else {
        setNewOrdersCount(0);
    }
  }, [user]);

  useEffect(() => {
    setIsMounted(true);
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

  const handleSuggestionClick = (productId: string) => {
    setSearchTerm(''); // Clear the search term from the input
    setShowSuggestions(false);
    router.push(`/products/${productId}`);
  }

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm.trim() || !showSuggestions) {
      return [];
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
    const consonantFilter = getConsonants(searchTerm);

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
  }, [searchTerm, allProducts, showSuggestions]);


  return (
    <header className="sticky top-0 z-40 w-full bg-[hsl(var(--header-background))]">
      <div className="container flex h-16 items-center justify-between gap-2 px-2 sm:px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
             <AnimatedLogo />
          </Link>
        </div>

        <div className="relative flex-1 max-w-4xl">
           <form onSubmit={handleSearchSubmit}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full rounded-md bg-white text-black pl-10"
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
          {isMounted && (
            <>
              {user && ['developer', 'shop-owner'].includes(user.role) && (
                <Button asChild size="icon" className="relative rounded-full bg-white text-blue-600 hover:bg-white/90">
                  <Link href="/shop-owner/orders">
                    <Bell className="h-5 w-5" />
                    {newOrdersCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center rounded-full p-0">{newOrdersCount}</Badge>
                    )}
                    <span className="sr-only">New Orders</span>
                  </Link>
                </Button>
              )}
            
              <ShoppingCartSheet>
                <Button size="icon" className="relative rounded-full bg-white text-blue-600 hover:bg-white/90">
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
                <Button asChild className="bg-white text-blue-600 hover:bg-white/90">
                  <Link href="/login">Login</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
