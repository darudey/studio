"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { CartItem, Product } from '@/types';
import { getProductsByIds } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

type CartDetailItem = CartItem & { product: Product | undefined };

interface CartContextType {
  cartItems: CartItem[];
  cartDetails: CartDetailItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number, stock: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, stock: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [productsInCart, setProductsInCart] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedCart = localStorage.getItem('wholesale-cart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem('wholesale-cart', JSON.stringify(cartItems));
    
    const fetchProductDetails = async () => {
      setLoading(true);
      const productIds = cartItems.map(item => item.productId);
      if(productIds.length > 0) {
        const products = await getProductsByIds(productIds);
        setProductsInCart(products);
      } else {
        setProductsInCart([]);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [cartItems]);

  const addToCart = (productId: string, quantity: number, stock: number) => {
    const product = productsInCart.find(p => p.id === productId);

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.productId === productId);

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > stock) {
           toast({ title: "Stock limit reached", description: `You cannot add more than ${stock} items.`, variant: "destructive" });
           return prevItems;
        }
        toast({ title: "Item updated in cart" });
        return prevItems.map(item =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      } else {
        if (quantity > stock) {
            toast({ title: "Stock limit reached", description: `You cannot add more than ${stock} items.`, variant: "destructive" });
            return prevItems;
        }
        toast({ title: "Item added to cart" });
        return [...prevItems, { productId, quantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({ title: "Item removed from cart" });
  };

  const updateQuantity = (productId: string, quantity: number, stock: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if(quantity > stock) {
        toast({ title: "Stock limit reached", description: `Only ${stock} items available.`, variant: "destructive" });
        setCartItems(prevItems => prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: stock } : item
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

  const cartCount = useMemo(() => cartItems.reduce((count, item) => count + item.quantity, 0), [cartItems]);

  const cartDetails = useMemo(() => cartItems.map(item => {
    const product = productsInCart.find(p => p.id === item.productId);
    return {
      ...item,
      product,
    };
  }), [cartItems, productsInCart]);


  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartDetails, loading }}>
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
