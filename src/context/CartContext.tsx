"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { products } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartDetails: (CartItem & { product: Product | undefined, subtotal: number })[];
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem('wholesale-cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('wholesale-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (productId: string, quantity: number) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === productId);
      const product = products.find(p => p.id === productId);

      if (!product) return prevItems;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
           toast({ title: "Stock limit reached", description: `You cannot add more than ${product.stock} items.`, variant: "destructive" });
           return prevItems;
        }
        toast({ title: "Item updated in cart", description: `${product.name} quantity increased.` });
        return prevItems.map(item =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > product.stock) {
            toast({ title: "Stock limit reached", description: `You cannot add more than ${product.stock} items.`, variant: "destructive" });
            return prevItems;
        }
        toast({ title: "Item added to cart", description: `${quantity} x ${product.name} added.` });
        return [...prevItems, { productId, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Item removed from cart" });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if(product && quantity > product.stock) {
        toast({ title: "Stock limit reached", description: `Only ${product.stock} items available.`, variant: "destructive" });
        setCartItems(prevItems => prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: product.stock } : item
        ));
        return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const cartDetails = cartItems.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      product,
      subtotal: product ? product.retailPrice * item.quantity : 0, // Simplified pricing
    };
  });

  const cartTotal = cartDetails.reduce((total, item) => total + item.subtotal, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartDetails, cartTotal }}>
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
