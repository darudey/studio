"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Clock, Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  isLoading: boolean;
  onClick: () => void;
}

export default function ProductCard({ product, isLoading, onClick }: ProductCardProps) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const cartItem = cartItems.find(item => item.productId === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const displayPrice = user?.role === 'wholesaler' || user?.role === 'developer' 
    ? product.wholesalePrice 
    : product.retailPrice;
    
  const mrp = product.retailPrice > displayPrice ? product.retailPrice : displayPrice * 1.25;
  const discount = mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;
  
  const handleIncrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    addToCart(product.id, 1, product.stock);
    setTimeout(() => setIsUpdating(false), 500); // Artificial delay for UX feedback
  };

  const handleDecrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1, product.stock);
    }
    setTimeout(() => setIsUpdating(false), 500); // Artificial delay for UX feedback
  };

  return (
    <Link href={`/products/${product.id}`} onClick={onClick} className="block w-full h-full">
      <div className="bg-card rounded-lg p-2.5 h-full flex flex-col border border-gray-200/80 relative">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )}
        <div className="relative">
            <div className="aspect-square relative">
                <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="20vw"
                data-ai-hint={product.dataAiHint}
                />
            </div>
            {discount > 0 && (
                <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md rounded-br-md">
                    {discount}% OFF
                </div>
            )}
             <div className="absolute bottom-[-10px] right-1">
                {quantityInCart === 0 ? (
                    <Button
                        size="sm"
                        className="bg-green-100 text-green-800 font-bold hover:bg-green-200 border border-green-600 h-8 rounded-lg shadow-md px-5"
                        onClick={handleIncrease}
                        disabled={isUpdating}
                        aria-label="Add to Cart"
                    >
                        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin"/> : 'ADD'}
                    </Button>
                ) : (
                    <div className="flex items-center gap-1 rounded-lg border border-green-600 bg-green-100 text-green-800 p-0 shadow-md h-8">
                        <Button size="icon" variant="ghost" className="h-full w-8 hover:bg-green-200 rounded-r-none" onClick={handleDecrease} disabled={isUpdating}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center font-bold text-sm tabular-nums">
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto"/> : quantityInCart}
                        </span>
                        <Button size="icon" variant="ghost" className="h-full w-8 hover:bg-green-200 rounded-l-none" onClick={handleIncrease} disabled={isUpdating}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
        
        <div className="mt-4 flex-grow flex flex-col">
            <div className="flex justify-between items-center text-xs">
                <span className="text-blue-600">{product.unit}</span>
                <span className="text-muted-foreground">Stock: <span className="font-bold text-foreground">{product.stock}</span></span>
            </div>
            <h3 className="font-medium text-sm leading-tight mt-1 flex-grow h-10 line-clamp-2">
                {product.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Clock className="w-3 h-3 text-blue-600"/>
                <span>15 MINS</span>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div>
                    <p className="text-sm font-bold">₹{displayPrice.toFixed(0)}</p>
                    {mrp > displayPrice && <p className="text-xs text-gray-500 line-through">₹{mrp.toFixed(0)}</p>}
                </div>
            </div>
        </div>
      </div>
    </Link>
  );
}
