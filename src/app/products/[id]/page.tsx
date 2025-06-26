"use client";

import { products } from "@/lib/data";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const product = products.find(p => p.id === params.id);

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity);
  };
  
  const price = user?.role === 'wholesaler' || user?.role === 'developer' ? product.wholesalePrice : product.retailPrice;

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex items-center justify-center">
            <Carousel className="w-full max-w-md">
                <CarouselContent>
                    {product.images.map((img, index) => (
                        <CarouselItem key={index}>
                            <Card>
                                <CardContent className="p-0 aspect-square relative">
                                    <Image
                                        src={img}
                                        alt={`${product.name} image ${index + 1}`}
                                        fill
                                        className="object-cover rounded-lg"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        data-ai-hint={product.dataAiHint}
                                    />
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{product.name}</h1>
            <Badge variant="outline">{product.category}</Badge>
          </div>
          <p className="text-muted-foreground text-lg">{product.description}</p>
          
          <div className="space-y-2">
            <p className="text-3xl font-bold">
              ${price.toFixed(2)} 
              <span className="text-lg font-normal text-muted-foreground"> / {product.unit}</span>
            </p>
            {user?.role === 'basic' && <p className="text-sm text-muted-foreground">Login as a wholesaler for special pricing.</p>}
          </div>

          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
              className="w-20"
              min="1"
            />
            <Button size="lg" className="flex-1 bg-accent hover:bg-accent/90" onClick={handleAddToCart}>
              Add to Cart
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">{product.stock} in stock</p>
        </div>
      </div>
    </div>
  );
}
