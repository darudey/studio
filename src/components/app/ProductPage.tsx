"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getNewestProducts, getRecommendedProducts, getTrendingProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import PromotionalBanners from './PromotionalBanners';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';

const HorizontalProductScroller = ({ products }: { products: Product[] }) => (
    <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map(product => (
            <ProductCard key={product.id} product={product} />
        ))}
    </div>
);

export default function ProductPage() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  
  const allCategories = useMemo(() => {
    return [...new Set(allProducts.map(p => p.category))].sort();
  }, [allProducts]);

  useEffect(() => {
    const fetchHomepageData = async () => {
        setLoading(true);
        try {
            const [
                products,
                newest,
                recommended
            ] = await Promise.all([
                getProducts(),
                getNewestProducts(),
                getRecommendedProducts()
            ]);

            setAllProducts(products);
            setNewestProducts(newest);
            setRecommendedProducts(recommended);

            try {
                const trending = await getTrendingProducts();
                setTrendingProducts(trending);
            } catch (err) {
                console.warn("Could not fetch trending products. This is expected for users without sufficient permissions.", err);
                setTrendingProducts([]);
            }

        } catch (e) {
            console.error("Failed to fetch main product data:", e);
        } finally {
            setLoading(false);
        }
    }
    fetchHomepageData();
  }, []);

  const filteredProducts = useMemo(() => {
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


  if (loading) {
      return (
          <div className="container py-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full mt-4" />
              <Skeleton className="h-8 w-48 my-6" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
              </div>
          </div>
      )
  }

  const displayedProducts = searchTerm.trim() ? filteredProducts : trendingProducts.length > 0 ? trendingProducts : newestProducts;

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={allCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {selectedCategory === "All" && searchTerm.trim() === '' && (
          <PromotionalBanners />
      )}

      <div className="py-6 px-4 bg-[hsl(var(--section-background))]">
        <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500"/>
            {searchTerm.trim() ? "Search Results" : "Lowest Prices Ever"}
        </h2>
        {displayedProducts.length > 0 ? (
            <HorizontalProductScroller products={displayedProducts} />
        ) : (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or searching again.</p>
          </div>
        )}
      </div>

      {recommendedProducts.length > 0 && selectedCategory === "All" && searchTerm.trim() === '' && (
        <div className="py-6 px-4 bg-background">
            <ProductCarousel title="Bestsellers" products={recommendedProducts} />
        </div>
      )}
    </div>
  );
}
