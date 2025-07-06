
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { Skeleton } from '../ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { useAllProducts, useRecommendedProducts } from '@/hooks/use-swr-data';
import { Progress } from '../ui/progress';

export default function ProductPage() {
  const { products: allProducts, isLoading: productsLoading } = useAllProducts();
  const { recommendedProducts, isLoading: recommendedLoading } = useRecommendedProducts();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  const loading = productsLoading || recommendedLoading;
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const allCategories = useMemo(() => {
    if (!allProducts) return [];
    return [...new Set(allProducts.map(p => p.category))].sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    let productsToFilter = [...allProducts];
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

  if (loading) {
      return (
          <div className="container py-8">
              <Progress value={progress} className="w-[60%] mx-auto mb-8" />
              <Skeleton className="h-24 w-full" />
              <div className="py-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-48 w-full" />
              </div>
              <div className="py-6">
                <Skeleton className="h-8 w-48 mb-4" />
                <Skeleton className="h-48 w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={allCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {!isFilteredView ? (
        <>
            {recommendedProducts && recommendedProducts.length > 0 && (
                <div className="py-6 bg-[hsl(var(--section-background))]">
                    <div className="container">
                        <ProductCarousel title="Daily Essentials" products={recommendedProducts} />
                    </div>
                </div>
            )}
            
            {allProducts && allCategories.map((category, index) => {
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
            })}
        </>
      ) : (
        <div className="container p-4">
             <h2 className="text-2xl font-bold tracking-tight mb-4">
                {searchTerm.trim() ? "Search Results" : `All in ${selectedCategory}`}
            </h2>
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
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
      )}
    </div>
  );
}
