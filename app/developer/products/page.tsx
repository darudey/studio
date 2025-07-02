
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPaginatedProducts } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(true);

  const limit = 20;

  const fetchProducts = useCallback(async (query: string, pageNum: number) => {
    if (pageNum === 1) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    
    const { products: newProducts, more } = await getPaginatedProducts({
      search: query,
      page: pageNum,
      limit,
    });
    
    setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
    setHasMore(more);
    setPage(pageNum);

    setLoading(false);
    setIsSearching(false);
  }, []);

  const debouncedFetch = useMemo(() => {
    return debounce((query: string) => {
      fetchProducts(query, 1);
    }, 300);
  }, [fetchProducts]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }
    debouncedFetch(searchTerm);
    return () => {
      debouncedFetch.cancel();
    };
  }, [user, router, searchTerm, debouncedFetch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(searchTerm, page + 1);
    }
  };
  
  const ProductCardSkeleton = () => (
      <div className="border p-4 rounded-lg shadow-sm space-y-2">
        <Skeleton className="h-5 bg-muted rounded w-3/4" />
        <Skeleton className="h-4 bg-muted rounded w-1/2" />
      </div>
  );

  if (!user) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 mb-6 flex justify-between items-center">
        <h1 className="text-xl font-bold">Manage Products</h1>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isSearching ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
         </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="border p-4 rounded-lg shadow-sm">
                <h4 className="font-medium truncate">{p.name}</h4>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No products found</h2>
          <p className="text-muted-foreground mt-2">Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
