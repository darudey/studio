
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { getProducts, getNewestProducts, getRecommendedProducts, getTrendingProducts } from '@/lib/data';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '../ui/skeleton';
import { useSearchParams } from 'next/navigation';

export default function ProductPage() {
  const { user } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [newestProducts, setNewestProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const view = searchParams.get('view') || 'all';

  useEffect(() => {
    const fetchHomepageData = async () => {
        setLoading(true);
        try {
            // Fetch non-problematic data first
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

            // Now, try to fetch trending products, and fail gracefully
            try {
                const trending = await getTrendingProducts();
                setTrendingProducts(trending);
            } catch (err) {
                console.warn("Could not fetch trending products. This is expected for users without sufficient permissions.", err);
                setTrendingProducts([]); // Set to empty on failure
            }

        } catch (e) {
            console.error("Failed to fetch main product data:", e);
        } finally {
            setLoading(false);
        }
    }
    fetchHomepageData();
  }, []);

  const productList = useMemo(() => {
    let sourceList: Product[];

    switch(view) {
        case 'trending':
            sourceList = trendingProducts;
            break;
        case 'recommended':
            sourceList = recommendedProducts;
            break;
        case 'new':
            sourceList = newestProducts;
            break;
        default:
            sourceList = allProducts;
    }

    if (searchTerm.trim() === '') {
        return sourceList;
    }

    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\\s\\W\\d_]/gi, '');
    const lowercasedSearch = searchTerm.toLowerCase();
    const consonantSearch = getConsonants(searchTerm);

    const filtered = sourceList.filter(product => {
      const nameLower = product.name.toLowerCase();
      if (nameLower.includes(lowercasedSearch)) {
        return true;
      }
      if (consonantSearch.length > 1) { // Fallback to consonant search
        if (getConsonants(product.name).includes(consonantSearch)) {
          return true;
        }
      }
      return false;
    });

    return filtered;
  }, [view, searchTerm, allProducts, trendingProducts, recommendedProducts, newestProducts]);


  if (loading) {
      return (
          <div className="container py-8">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
              </div>
          </div>
      )
  }

  return (
    <div className="container">
      <div className="py-8">
        {productList.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {productList.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="text-muted-foreground mt-2">Try adjusting your filters or searching again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
