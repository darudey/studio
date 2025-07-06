
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const CategoryCarouselSkeleton = () => (
    <div className="py-6">
        <div className="container">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex gap-4 overflow-hidden">
                <Skeleton className="h-72 min-w-[45%] sm:min-w-[30%]" />
                <Skeleton className="h-72 min-w-[45%] sm:min-w-[30%]" />
                <Skeleton className="h-72 hidden sm:block sm:min-w-[30%]" />
            </div>
        </div>
    </div>
);


export default function ProductPage({ initialRecommended }: { initialRecommended: Product[] }) {
  // State for all products fetched on the client
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // Loading state specifically for the client-side fetch
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  // Fetch all other products on the client side after the initial render
  useEffect(() => {
    const fetchRemainingProducts = async () => {
        setIsLoading(true);
        try {
            const products = await getProducts();
            // Filter out the recommended products to avoid duplication, in case they are also in the main list
            const nonRecommendedProducts = products.filter(p => !initialRecommended.find(rec => rec.id === p.id));
            setAllProducts(nonRecommendedProducts);
        } catch (e) {
            console.error("Failed to fetch all products:", e);
        } finally {
            setIsLoading(false);
        }
    }
    fetchRemainingProducts();
  }, [initialRecommended]);
  
  const allCategories = useMemo(() => {
    // Combine categories from both initial and loaded products
    const combinedProducts = [...initialRecommended, ...allProducts];
    const categories = [...new Set(combinedProducts.map(p => p.category))].sort();
    return categories;
  }, [allProducts, initialRecommended]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All" && !searchTerm.trim()) {
        return [];
    }
    
    // Search across all products when a filter or search is active
    const searchableProducts = [...initialRecommended, ...allProducts];

    let productsToFilter = searchableProducts;
    
    if (selectedCategory !== "All") {
      productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }

    if (!searchTerm.trim()) {
      return productsToFilter;
    }

    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
    const consonantFilter = getConsonants(searchTerm);

    return productsToFilter.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedFilter);
      const categoryMatch = product.category.toLowerCase().includes(lowercasedFilter);
      
      if (nameMatch || itemCodeMatch || categoryMatch) {
        return true;
      }
      
      if (consonantFilter.length >= 2) {
        const nameConsonants = getConsonants(product.name);
        if (nameConsonants.includes(consonantFilter)) {
            return true;
        }
      }

      return false;
    });
  }, [allProducts, initialRecommended, selectedCategory, searchTerm]);

  const isFilteredView = selectedCategory !== "All" || searchTerm.trim() !== '';

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={allCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {isFilteredView ? (
        // Filtered/Search View
        <div className="container p-4">
             <h2 className="text-2xl font-bold tracking-tight mb-4">
                {searchTerm.trim() ? "Search Results" : `All in ${selectedCategory}`}
            </h2>
            {isLoading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredProducts.map((product, index) => (
                        <ProductCard key={product.id} product={product} animationIndex={index} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <h2 className="text-xl font-semibold">No products found</h2>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters or searching again.</p>
                </div>
            )}
        </div>
      ) : (
        // Default View
        <>
          {initialRecommended && initialRecommended.length > 0 && (
              <div className="py-6 bg-[hsl(var(--section-background))]">
                  <div className="container">
                      <ProductCarousel title="Recommended for You" products={initialRecommended} />
                  </div>
              </div>
          )}
          
          {isLoading ? (
             <>
                <CategoryCarouselSkeleton />
                <CategoryCarouselSkeleton />
             </>
          ) : (
            allCategories.map((category, index) => {
                if (category === "Uncategorized" && !allProducts.some(p => p.category === "Uncategorized")) return null;
                const categoryProducts = allProducts.filter(p => p.category === category);
                if (categoryProducts.length === 0) return null;
                // Alternate background colors for visual separation
                const bgColor = index % 2 === 0 ? 'bg-background' : 'bg-[hsl(var(--section-background))]';
                return (
                    <div key={category} className={`py-6 ${bgColor}`}>
                        <div className="container">
                             <ProductCarousel title={category} products={categoryProducts} />
                        </div>
                    </div>
                )
            })
          )}
        </>
      )}
    </div>
  );
}
