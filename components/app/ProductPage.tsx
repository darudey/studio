
"use client";

import React, { useState, useMemo } from 'react';
import type { Product } from '@/types';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import CategoryNav from './CategoryNav';
import { useSearchParams } from 'next/navigation';
import { useCategorySettings } from '@/context/CategorySettingsContext';

interface ProductPageProps {
  serverRecommendedProducts: Product[];
  serverCategories: string[];
  serverAllProducts: Product[];
}

export default function ProductPage({ 
  serverRecommendedProducts, 
  serverCategories, 
  serverAllProducts
}: ProductPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('search') || '';
  const { settingsMap } = useCategorySettings();

  const handleProductClick = (productId: string) => {
    setLoadingProductId(productId);
  };

  const filteredProducts = useMemo(() => {
    let productsToFilter = [...serverAllProducts];
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
  }, [serverAllProducts, selectedCategory, searchTerm]);

  const isFilteredView = selectedCategory !== "All" || searchTerm.trim() !== '';

  return (
    <div className="bg-background min-h-screen">
      <CategoryNav 
        categories={serverCategories}
        selectedCategory={selectedCategory}
        onCategorySelect={(category) => {
            setSelectedCategory(category);
            setLoadingProductId(null);
        }}
      />

      {!isFilteredView ? (
        <>
            {serverRecommendedProducts.length > 0 && (
                <div className="py-6 bg-[hsl(var(--section-background))]">
                    <div className="container">
                        <ProductCarousel 
                            title="Daily Essentials" 
                            products={serverRecommendedProducts} 
                            loadingProductId={loadingProductId}
                            onProductClick={handleProductClick}
                            categorySettingsMap={settingsMap}
                        />
                    </div>
                </div>
            )}
            
            {serverCategories.map((category, index) => {
                const categoryProducts = serverAllProducts.filter(p => p.category === category);
                if (categoryProducts.length === 0) return null;
                const bgColor = index % 2 === 0 ? 'bg-background' : 'bg-[hsl(var(--section-background))]';
                return (
                    <div key={category} className={`py-6 ${bgColor}`}>
                        <div className="container">
                             <ProductCarousel 
                                title={category} 
                                products={categoryProducts} 
                                loadingProductId={loadingProductId}
                                onProductClick={handleProductClick}
                                categorySettingsMap={settingsMap}
                             />
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
                        <ProductCard 
                            key={product.id} 
                            product={product} 
                            isLoading={loadingProductId === product.id}
                            onClick={() => handleProductClick(product.id)}
                            placeholderImageUrl={settingsMap[product.category]}
                        />
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
