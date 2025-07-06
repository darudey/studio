
"use client";

import React, { useState, useMemo, useEffect } from 'react';
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


export default function ProductPage({ allProducts: serverProducts, initialRecommended }: { allProducts: Product[], initialRecommended: Product[] }) {
  // State for all products, initialized with server data
  const [allProducts, setAllProducts] = useState<Product[]>(serverProducts);
  // Loading state specifically for the client-side fetch, now defaults to false
  const [isLoading, setIsLoading] = useState(serverProducts.length === 0);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  const allCategories = useMemo(() => {
    // Categories are derived from the full product list
    const categories = [...new Set(allProducts.map(p => p.category))].sort();
    return categories;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All" && !searchTerm.trim()) {
        return [];
    }
    
    let productsToFilter = allProducts;
    
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
  }, [allProducts, selectedCategory, searchTerm]);

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
