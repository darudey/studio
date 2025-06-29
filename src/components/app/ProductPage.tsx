
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getNewestProducts, getRecommendedProducts, getTrendingProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import ProductCarousel from './ProductCarousel';
import { Separator } from '../ui/separator';
import { useSearchParams } from 'next/navigation';

export default function ProductPage() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: 'All',
    priceRange: [0, 100],
  });

  useEffect(() => {
    const fetchHomepageData = async () => {
        try {
            const [
                products, 
                trending, 
                newest, 
                recommended
            ] = await Promise.all([
                getProducts(),
                getTrendingProducts(),
                getNewestProducts(),
                getRecommendedProducts()
            ]);
            
            setAllProducts(products);
            setTrendingProducts(trending);
            setNewestProducts(newest);
            setRecommendedProducts(recommended);

            if (products.length > 0) {
                const maxPrice = Math.ceil(Math.max(...products.map(p => p.retailPrice), 0));
                setFilters(prev => ({...prev, priceRange: [0, maxPrice || 100]}));
            }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    fetchHomepageData();
  }, []);
  
  useEffect(() => {
    setFilters(prev => ({...prev, search: searchParams.get('search') || ''}));
  }, [searchParams]);


  const { filteredProducts, categories, maxPrice } = useMemo(() => {
    const categories = [...new Set(allProducts.map(p => p.category))].sort();
    const maxPriceVal = allProducts.length > 0 ? Math.ceil(Math.max(...allProducts.map(p => p.retailPrice), 0)) : 100;

    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\s\W\d_]/gi, '');
    const lowercasedSearch = filters.search.toLowerCase();
    const consonantSearch = getConsonants(filters.search);

    const filtered = allProducts.filter(product => {
      const price = user?.role === 'wholesaler' || user?.role === 'developer' ? product.wholesalePrice : product.retailPrice;

      let matchesSearch = filters.search.trim() === '';
      if (!matchesSearch) {
        const nameLower = product.name.toLowerCase();
        if (nameLower.includes(lowercasedSearch)) {
          matchesSearch = true;
        } else if (consonantSearch.length > 1) { // Fallback to consonant search
          if (getConsonants(product.name).includes(consonantSearch)) {
            matchesSearch = true;
          }
        }
      }

      const matchesCategory = filters.category === 'All' || product.category === filters.category;
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return { filteredProducts: filtered, categories, maxPrice: maxPriceVal };
  }, [filters, user, allProducts]);

  const handleFilterChange = (newFilters: { category: string, priceRange: [number, number] }) => {
    setFilters(prev => ({
        ...prev,
        ...newFilters
    }));
  };

  const sections = [
    { title: "Trending Now", products: trendingProducts },
    { title: "Shop Owner Recommendations", products: recommendedProducts },
    { title: "New Arrivals", products: newestProducts }
  ].filter(section => section.products.length > 0);

  if (loading) {
      return (
          <div className="container py-8">
              <Skeleton className="h-10 w-1/3 mb-6" />
              <Skeleton className="h-40 w-full mb-8" />
              <Skeleton className="h-40 w-full mb-8" />
              <Skeleton className="h-24 w-full mb-8" />
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
          </div>
      )
  }

  return (
    <div className="container">
      {sections.map((section, index) => (
        <ProductCarousel key={index} title={section.title} products={section.products} />
      ))}
      
      {sections.length > 0 && <Separator className="my-8" />}

      <div className="py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">All Products</h1>
        <ProductFilters 
          filters={{category: filters.category, priceRange: filters.priceRange}}
          onFilterChange={handleFilterChange} 
          categories={categories} 
          maxPrice={maxPrice} />
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or searching with just consonants (e.g., 'bnn' for 'banana').</p>
          </div>
        )}
      </div>
    </div>
  );
}
