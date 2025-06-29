
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
  
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1, product.stock);
  };

  const handleIncrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1, product.stock);
  };

  const handleDecrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, quantityInCart - 1, product.stock);
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="border-b p-0">
        <div className="aspect-square relative group">
          <Link href={`/products/${product.id}`} className="block h-full w-full">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              data-ai-hint={product.dataAiHint}
            />
          </Link>
          <div className="absolute bottom-2 right-2">
            {quantityInCart === 0 ? (
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-md"
                    onClick={handleAddToCart}
                    aria-label="Add to Cart"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            ) : (
                <div className="flex items-center gap-1 rounded-full border bg-background p-0.5 shadow-md">
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={handleDecrease}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-bold text-md tabular-nums">{quantityInCart}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={handleIncrease}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            )}
          </div>
        </div>
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
        </div>
      </CardFooter>
    </Card>
  );
}
