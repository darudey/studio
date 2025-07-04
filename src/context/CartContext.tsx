
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo } from 'react';
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
  const [productsInCart, setProductsInCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const cartStorageKey = useMemo(() => {
    if (authLoading) return null;
    return user ? `wholesale-cart-${user.id}` : 'wholesale-cart-guest';
  }, [user, authLoading]);

  // Effect to load cart from localStorage when user (and key) changes
  useEffect(() => {
    if (!cartStorageKey) return;

    setLoading(true);
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
    setLoading(false);
  }, [cartStorageKey]);

  // Effect to save to localStorage and fetch product details
  useEffect(() => {
    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    }
    
    const fetchProductDetails = async () => {
      setLoading(true);
      const productIds = cartItems.map(item => item.productId);
      if (productIds.length > 0) {
        const products = await getProductsByIds(productIds);
        setProductsInCart(products);
      } else {
        setProductsInCart([]);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [cartItems, cartStorageKey]);

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
      const newCartItems = [...cartItems, { productId, quantity }];
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
    const product = productsInCart.find(p => p.id === item.productId);
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
