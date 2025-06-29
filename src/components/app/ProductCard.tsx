"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const displayPrice = user?.role === 'wholesaler' || user?.role === 'developer' 
    ? product.wholesalePrice 
    : product.retailPrice;

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
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={product.dataAiHint}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle className="text-lg font-semibold leading-tight mb-2">
            <Link href={`/products/${product.id}`}>{product.name}</Link>
        </CardTitle>
        <div className="text-sm text-muted-foreground">{product.category}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full items-center justify-between">
          <p className="text-xl font-bold text-foreground">
            ₹{displayPrice.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">/{product.unit}</span>
          </p>
          <Button 
            size="sm" 
            className="bg-accent hover:bg-accent/90"
            onClick={() => addToCart(product.id, 1, product.stock)}
          >
            <Plus className="h-4 w-4 mr-1"/>
            Add
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
