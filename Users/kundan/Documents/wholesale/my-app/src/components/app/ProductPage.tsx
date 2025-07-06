
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts } from '@/lib/data'; // No longer need getRecommendedProducts here
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

// A more targeted skeleton for the parts that load on the client
function CategoriesSkeleton() {
  return (
    <>
      {[...Array(2)].map((_, i) => (
        <div key={i} className={`py-6 ${i % 2 === 0 ? 'bg-background' : 'bg-[hsl(var(--section-background))]'}`}>
            <div className="container">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-72 w-full" />)}
              </div>
            </div>
        </div>
      ))}
    </>
  );
}

// The component now accepts initial data fetched on the server
export default function ProductPage({ initialRecommendedProducts }: { initialRecommendedProducts: Product[] }) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true); // This now tracks client-side fetching
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  // Fetch the rest of the products on the client-side
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const productsData = await getProducts();
      setAllProducts(productsData);
      setLoading(false);
    };
    fetchData();
  }, []);

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
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
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
          {/* Render the "Recommended" section immediately with server-fetched data */}
          {initialRecommendedProducts && initialRecommendedProducts.length > 0 && (
              <div className="py-6 bg-[hsl(var(--section-background))]">
                  <div className="container">
                      <ProductCarousel title="Daily Essentials" products={initialRecommendedProducts} />
                  </div>
              </div>
          )}

          {/* Render other categories after client-side fetch */}
          {loading ? (
            <CategoriesSkeleton />
          ) : (
            allCategories.map((category, index) => {
                const categoryProducts = allProducts.filter(p => p.category === category);
                if (categoryProducts.length === 0) return null;
                // Alternate background color, ensuring "Daily Essentials" background doesn't affect the pattern
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
