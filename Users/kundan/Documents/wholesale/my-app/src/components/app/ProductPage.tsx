
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getRecommendedProducts, getNewestProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

const HomePageSkeleton = () => (
    <div className="container py-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full mt-4" />
        <Skeleton className="h-8 w-48 my-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
    </div>
);

export default function ProductPage() {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  useEffect(() => {
    const fetchHomepageData = async () => {
        setLoading(true);
        try {
            const [products, recommended, newest] = await Promise.all([
                getProducts(),
                getRecommendedProducts(),
                getNewestProducts(40)
            ]);
            setAllProducts(products);
            setRecommendedProducts(recommended);
            setNewestProducts(newest);
        } catch (e) {
            console.error("Failed to fetch homepage data:", e);
        } finally {
            setLoading(false);
        }
    }
    fetchHomepageData();
  }, []);
  
  const allCategories = useMemo(() => {
    const categories = [...new Set(newestProducts.map(p => p.category))].sort();
    return categories;
  }, [newestProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All" && !searchTerm.trim()) {
        return [];
    }

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
      return <HomePageSkeleton />;
  }

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
            {filteredProducts.length > 0 ? (
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
