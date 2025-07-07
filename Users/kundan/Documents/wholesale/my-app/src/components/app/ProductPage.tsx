
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

export default function ProductPage({ initialDailyEssentials }: { initialDailyEssentials: Product[] }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(13);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  const categories = useMemo(() => {
    const combinedProducts = isLoading ? initialDailyEssentials : allProducts;
    const uniqueCategories = [...new Set(combinedProducts.map(p => p.category))];
    const essentialsFirst = uniqueCategories.includes("Daily Essentials") ? ["Daily Essentials"] : [];
    const otherCats = uniqueCategories.filter(c => c !== "Daily Essentials").sort();
    return ['All', ...essentialsFirst, ...otherCats];
  }, [allProducts, initialDailyEssentials, isLoading]);

  useEffect(() => {
    const fetchAllProducts = async () => {
        setIsLoading(true);
        const timer = setTimeout(() => setProgress(66), 500);
        try {
            const products = await getProducts();
            setAllProducts(products);
        } catch (error) {
            console.error("Failed to fetch all products:", error);
        } finally {
            clearTimeout(timer);
            setProgress(100);
            setIsLoading(false);
        }
    };
    fetchAllProducts();
  }, []);

  const dailyEssentials = useMemo(() => {
    if (isLoading) return initialDailyEssentials;
    return allProducts.filter(p => p.category === "Daily Essentials");
  }, [isLoading, allProducts, initialDailyEssentials]);

  const allOtherProducts = useMemo(() => {
    if (isLoading) return [];
    return allProducts.filter(p => p.category !== "Daily Essentials");
  }, [isLoading, allProducts]);

  const filteredProducts = useMemo(() => {
    const productsToUse = isLoading ? initialDailyEssentials : allProducts;
    let productsToFilter = productsToUse;
    
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
  }, [allProducts, initialDailyEssentials, isLoading, selectedCategory, searchTerm]);

  const isFilteredView = selectedCategory !== "All" || searchTerm.trim() !== '';

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
      {isLoading && <Progress value={progress} className="w-full h-1 rounded-none" />}

      {isFilteredView ? (
        <div className="container p-4">
             <h2 className="text-2xl font-bold tracking-tight my-4">
                {searchTerm.trim() ? `Search Results for "${searchTerm}"` : `${selectedCategory}`}
            </h2>
            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
          <div className="py-6 bg-[hsl(var(--section-background))]">
              <div className="container">
                  <h2 className="text-2xl font-bold tracking-tight mb-4">Daily Essentials</h2>
                  {dailyEssentials.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {dailyEssentials.map((product) => (
                              <ProductCard key={product.id} product={product} />
                          ))}
                      </div>
                  ) : (
                      !isLoading && <p className="text-muted-foreground">No "Daily Essentials" products found at the moment.</p>
                  )}
              </div>
          </div>
          
          <div className="py-6">
            <div className="container">
              <h2 className="text-2xl font-bold tracking-tight mb-4">All Products</h2>
              {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
                  </div>
              ) : (
                allOtherProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {allOtherProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                   dailyEssentials.length === 0 && <div className="text-center py-10">
                      <p className="text-muted-foreground">No products have been added to the store yet.</p>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
