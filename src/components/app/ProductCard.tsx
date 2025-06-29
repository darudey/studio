"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Plus, Minus } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { user } = useAuth();

  const displayPrice = user?.role === 'wholesaler' || user?.role === 'developer' 
    ? product.wholesalePrice 
    : product.retailPrice;

  const cartItem = cartItems.find(item => item.productId === product.id);
  const quantityInCart = cartItem?.quantity || 0;
  
  const handleAddToCart = () => {
    addToCart(product.id, 1, product.stock);
  };

  const handleIncrease = () => {
    // addToCart in CartContext handles incrementing quantity if item exists
    addToCart(product.id, 1, product.stock);
  };

  const handleDecrease = () => {
    updateQuantity(product.id, quantityInCart - 1, product.stock);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b p-0">
        <Link href={`/products/${product.id}`} className="block">
          <div className="aspect-square relative">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              data-ai-hint={product.dataAiHint}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4 pb-2">
        <CardTitle className="text-base font-semibold leading-tight mb-2 h-10 overflow-hidden">
            <Link href={`/products/${product.id}`} className="hover:underline">{product.name}</Link>
        </CardTitle>
        <div className="text-sm text-muted-foreground">{product.category}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col">
            <p className="text-lg font-bold text-foreground">
              ₹{displayPrice.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground -mt-1">/{product.unit}</p>
          </div>
          {quantityInCart === 0 ? (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleAddToCart}
            >
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-md border p-0.5">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleDecrease}>
                    <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-bold text-md tabular-nums">{quantityInCart}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleIncrease}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
