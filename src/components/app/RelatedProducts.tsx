"use client";
import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { suggestRelatedProducts } from '@/ai/flows/suggest-related-products';
import { Skeleton } from '@/components/ui/skeleton';
import { getProducts } from '@/lib/data';
import type { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

export function RelatedProducts() {
  const { cartDetails, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      if (cartDetails.length === 0) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const cartItemNames = cartDetails
          .map(item => item.product?.name)
          .filter((name): name is string => !!name);

        if (cartItemNames.length > 0) {
            const result = await suggestRelatedProducts({ cartItems: cartItemNames });
            const allProducts = await getProducts();
            const suggestedProducts = result.map(name => 
                allProducts.find(p => p.name.toLowerCase() === name.toLowerCase())
            ).filter((p): p is Product => p !== undefined);

            setSuggestions(suggestedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch related products:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
        fetchSuggestions();
    }, 500); // Debounce API calls

    return () => clearTimeout(timer);

  }, [cartDetails]);

  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold">You might also like...</h4>
        <div className="grid grid-cols-3 gap-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-foreground">You might also like...</h4>
      <div className="grid grid-cols-1 gap-4">
        {suggestions.map(product => product && (
          <div key={product.id} className="flex items-center space-x-3 rounded-md border p-2">
            <Link href={`/products/${product.id}`} className='w-16 h-16'>
                <div className="relative h-16 w-16 overflow-hidden rounded">
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover" data-ai-hint={product.dataAiHint}/>
                </div>
            </Link>
            <div className="flex-1">
              <Link href={`/products/${product.id}`} className='text-sm font-medium hover:underline'>{product.name}</Link>
              <p className="text-xs text-muted-foreground">₹{product.retailPrice.toFixed(2)}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => addToCart(product.id, 1, product.stock)}>
                <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
