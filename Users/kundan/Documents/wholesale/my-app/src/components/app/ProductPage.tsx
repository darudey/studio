
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductPageProps {
  recommendedProducts: Product[];
  newestProducts: Product[];
  allCategories: string[];
}

export default function ProductPage({ recommendedProducts, newestProducts, allCategories }: ProductPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const [fullProductList, setFullProductList] = useState<Product[]>([]);
  const [isLoadingFullList, setIsLoadingFullList] = useState(false);

  const isFilteredView = selectedCategory !== "All" || searchTerm.trim() !== '';

  useEffect(() => {
    // Lazy-load the full product list only when the user enters a filtered view
    // and the list hasn't been loaded yet.
    if (isFilteredView && fullProductList.length === 0 && !isLoadingFullList) {
      setIsLoadingFullList(true);
      getProducts().then(products => {
        setFullProductList(products);
        setIsLoadingFullList(false);
      });
    }
  }, [isFilteredView, fullProductList.length, isLoadingFullList]);

  const filteredProducts = useMemo(() => {
    if (!isFilteredView) return []; // Don't filter unless needed
    if (fullProductList.length === 0) return []; // Wait for the full list to be loaded

    let productsToFilter = [...fullProductList];
    
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
  }, [fullProductList, selectedCategory, searchTerm, isFilteredView]);


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
            {isLoadingFullList ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, index) => (
                        <Skeleton key={index} className="h-72 w-full" />
                    ))}
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
          {recommendedProducts && recommendedProducts.length > 0 && (
              <div className="py-6 bg-[hsl(var(--section-background))]">
                  <div className="container">
                      <ProductCarousel title="Recommended for You" products={recommendedProducts} />
                  </div>
              </div>
          )}
          
          {newestProducts && newestProducts.length > 0 && (
              <div className="py-6 bg-background">
                  <div className="container">
                      <ProductCarousel title="New Arrivals" products={newestProducts} />
                  </div>
              </div>
          )}
        </>
      )}
    </div>
  );
}
