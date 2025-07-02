"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <CardContent className="flex flex-1 flex-col p-3">
        <div>
          <h3 className="font-medium text-sm leading-tight h-10">
            <Link href={`/products/${product.id}`} className="hover:underline line-clamp-2">
              {product.name}
            </Link>
          </h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{product.category}</p>
        </div>
        
        <div className="mt-auto pt-2">
          <p className="text-lg font-bold">
            ₹{displayPrice.toFixed(2)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/{product.unit}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
