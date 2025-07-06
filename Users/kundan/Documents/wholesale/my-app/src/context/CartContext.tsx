
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { CartItem, Product } from '@/types';
import { getProductsByIds } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from './AuthContext';

type CartDetailItem = CartItem & { product: Product | undefined };

interface CartContextType {
  cartItems: CartItem[];
  cartDetails: CartDetailItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number, stock: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, stock: number) => void;
  updateItemNote: (productId: string, note: string) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const cartStorageKey = useMemo(() => {
    if (authLoading) return null;
    return user ? `wholesale-cart-${user.id}` : 'wholesale-cart-guest';
  }, [user, authLoading]);

  // Effect to load cart from localStorage when the key is ready
  useEffect(() => {
    if (!cartStorageKey) return;
    const storedCart = localStorage.getItem(cartStorageKey);
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart from localStorage", e);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [cartStorageKey]);

  // Effect to save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    }
  }, [cartItems, cartStorageKey]);

  // Derive product IDs from cart items for SWR
  const productIdsInCart = useMemo(() => cartItems.map(item => item.productId), [cartItems]);

  // Use SWR to fetch and cache product details
  const { data: productsInCart, isLoading: productsLoading } = useSWR(
    // The key is an array; SWR won't fetch if the key is null.
    // Sorting the IDs ensures the key is stable for the same set of products.
    productIdsInCart.length > 0 ? ['products', ...productIdsInCart.sort()] : null,
    // The fetcher function receives the key, but we only need the IDs from it.
    ([, ...ids]) => getProductsByIds(ids as string[])
  );

  const loading = authLoading || (productIdsInCart.length > 0 && productsLoading);

  const addToCart = (productId: string, quantity: number, stock: number) => {
    const existingItem = cartItems.find(item => item.productId === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > stock) {
         toast({ title: "Stock limit reached", description: `You cannot add more than ${stock} items.`, variant: "destructive" });
         return;
      }
      const newCartItems = cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(newCartItems);
      toast({ title: "Item updated in cart" });
    } else {
      if (quantity > stock) {
          toast({ title: "Stock limit reached", description: `You cannot add more than ${stock} items.`, variant: "destructive" });
          return;
      }
      const newCartItems = [...cartItems, { productId, quantity, note: '' }];
      setCartItems(newCartItems);
      toast({ title: "Item added to cart" });
    }
  };

  const removeFromCart = (productId: string) => {
    const newCartItems = cartItems.filter(item => item.productId !== productId);
    setCartItems(newCartItems);
    toast({ title: "Item removed from cart" });
  };

  const updateQuantity = (productId: string, quantity: number, stock: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if(quantity > stock) {
        toast({ title: "Stock limit reached", description: `Only ${stock} items available.`, variant: "destructive" });
        const newCartItems = cartItems.map(item =>
            item.productId === productId ? { ...item, quantity: stock } : item
        );
        setCartItems(newCartItems);
        return;
    }

    const newCartItems = cartItems.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setCartItems(newCartItems);
  };

  const updateItemNote = (productId: string, note: string) => {
    setCartItems(currentCart => currentCart.map(item =>
        item.productId === productId ? { ...item, note } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  const cartDetails = useMemo(() => cartItems.map(item => {
    const product = productsInCart?.find(p => p.id === item.productId);
    return {
      ...item,
      product,
    };
  }), [cartItems, productsInCart]);


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, updateItemNote, clearCart, cartCount, cartDetails, loading }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
