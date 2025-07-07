
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts } from '@/lib/data';

const ProductCarouselSkeleton = () => (
    <div className="py-6">
        <div className="container">
            <Skeleton className="h-8 w-48 mb-4" /> {/* Carousel Title skeleton */}
            <div className="flex gap-4 overflow-hidden">
                <Skeleton className="h-72 min-w-[45%] sm:min-w-[30%]" />
                <Skeleton className="h-72 min-w-[45%] sm:min-w-[30%]" />
                <Skeleton className="h-72 hidden sm:block sm:min-w-[30%]" />
            </div>
        </div>
    </div>
);


export default function ProductPage({ initialDailyEssentials }: { initialDailyEssentials: Product[] }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  useEffect(() => {
    // This effect runs on the client after the initial render to fetch the full catalog.
    const fetchAllProducts = async () => {
        setIsLoading(true);
        try {
            const products = await getProducts();
            setAllProducts(products);
        } catch (error) {
            console.error("Failed to fetch all products:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchAllProducts();
  }, []);
  
  const categories = useMemo(() => {
    return [...new Set(allProducts.map(p => p.category))].sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All" && !searchTerm.trim()) {
        return [];
    }
    
    let productsToFilter = allProducts;
    
    if (selectedCategory !== "All") {
      productsToFilter = productsToFilter.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());
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
  
  const initialProductIds = useMemo(() => new Set(initialDailyEssentials.map(p => p.id)), [initialDailyEssentials]);

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {isFilteredView ? (
        <div className="container p-4">
             <h2 className="text-2xl font-bold tracking-tight mb-4">
                {searchTerm.trim() ? "Search Results" : `All in ${selectedCategory}`}
            </h2>
            {isLoading ? (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
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
        <>
          {/* SECTION 1: Daily Essentials (loads instantly from server props) */}
          {initialDailyEssentials && initialDailyEssentials.length > 0 && (
              <div className="py-6 bg-[hsl(var(--section-background))]">
                  <div className="container">
                      <ProductCarousel title="Daily Essentials" products={initialDailyEssentials} />
                  </div>
              </div>
          )}
          
          {/* SECTION 2: Other Categories (loads from client-side fetch) */}
          {isLoading ? (
            // Show skeletons while the main catalog is loading.
            <>
                <ProductCarouselSkeleton />
                <ProductCarouselSkeleton />
            </>
          ) : (
            // Once loaded, render the remaining categories.
            categories
            .filter(category => category.toLowerCase() !== 'daily essentials')
            .map((category, index) => {
              // Get products for this category, EXCLUDING the ones we already loaded.
              const categoryProducts = allProducts.filter(p => p.category === category && !initialProductIds.has(p.id));
              if (categoryProducts.length === 0) return null;
              
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
