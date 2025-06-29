"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import React from 'react';

interface ProductFiltersProps {
  filters: {
    category: string;
    priceRange: [number, number];
  };
  onFilterChange: (filters: ProductFiltersProps['filters']) => void;
  categories: string[];
  maxPrice: number;
}

export default function ProductFilters({ filters, onFilterChange, categories, maxPrice }: ProductFiltersProps) {
  
  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value });
  };

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  return (
    <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    {["All", ...categories].map(cat => (
                        <SelectItem key={cat} value={cat}>
                            {cat}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="space-y-2">
                <label className="text-sm font-medium">Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}</label>
                <Slider
                    min={0}
                    max={Math.ceil(maxPrice)}
                    step={1}
                    value={[filters.priceRange[0], filters.priceRange[1]]}
                    onValueChange={handlePriceChange}
                    className="w-full"
                />
            </div>
        </div>
    </div>
  );
}
