"use client";

import React, { useState, useMemo } from 'react';
import { products as allProducts } from '@/lib/data';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import { useAuth } from '@/context/AuthContext';

export default function ProductPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    priceRange: [0, Math.ceil(Math.max(...allProducts.map(p => p.retailPrice)))],
  });

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const price = user?.role === 'wholesaler' ? product.wholesalePrice : product.retailPrice;

      const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = filters.category === 'All' || product.category === filters.category;
      const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
      
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [filters, user]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Product Catalog</h1>
      <ProductFilters filters={filters} onFilterChange={setFilters} />
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No products found</h2>
          <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
