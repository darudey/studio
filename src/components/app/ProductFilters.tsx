"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { products } from "@/lib/data";
import { Search } from "lucide-react";
import React from 'react';

interface ProductFiltersProps {
  filters: {
    search: string;
    category: string;
    priceRange: [number, number];
  };
  onFilterChange: (filters: ProductFiltersProps['filters']) => void;
}

const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];
const maxPrice = Math.max(...products.map(p => p.retailPrice));

export default function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (value: string) => {
    onFilterChange({ ...filters, category: value });
  };

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  return (
    <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="pl-10"
                />
            </div>
            <Select value={filters.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>
                            {cat}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="space-y-2">
                <label className="text-sm font-medium">Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</label>
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
