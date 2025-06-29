
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
    e.preventDefault(); // Prevent link navigation when clicking the button on the image
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
          {quantityInCart === 0 && (
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
              <Button 
                variant="secondary"
                className="w-full"
                onClick={handleAddToCart}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          )}
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
          {quantityInCart > 0 && (
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
