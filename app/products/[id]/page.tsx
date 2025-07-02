
"use client";

import { getProductById, getProducts } from "@/lib/data";
import { notFound, useParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { Product } from "@/types";
import { Minus, Plus, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCarousel from "@/components/app/ProductCarousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ProductDetailPage() {
  const params = useParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productId = params.id as string;
    if (!productId) return;

    const fetchProductData = async () => {
      setLoading(true);
      try {
        const foundProduct = await getProductById(productId);
        if (foundProduct) {
          setProduct(foundProduct);
          // Fetch similar products
          const allProducts = await getProducts();
          const similar = allProducts
            .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
            .slice(0, 6);
          setSimilarProducts(similar);
        } else {
          notFound();
        }
      } catch (error) {
        console.error("Failed to fetch product data", error);
        notFound();
      }
      setLoading(false);
    };
    fetchProductData();
  }, [params.id]);

  const cartItem = cartItems.find(item => item.productId === product?.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product.id, 1, product.stock);
  };
  
  const handleIncrease = () => {
    if (!product) return;
    addToCart(product.id, 1, product.stock);
  };

  const handleDecrease = () => {
    if (!product) return;
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1, product.stock);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="w-full aspect-square max-w-md mx-auto" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/4" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return null; // notFound() is called from useEffect
  }
  
  const price = user?.role === 'wholesaler' || user?.role === 'developer' ? product.wholesalePrice : product.retailPrice;
  const mrp = product.retailPrice > price ? product.retailPrice : price * 1.25;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="pb-32"> {/* Padding bottom to make space for sticky footer */}
      <div className="max-w-4xl mx-auto">
        <div className="w-full">
            <Carousel>
                <CarouselContent>
                    {product.images.map((img, index) => (
                        <CarouselItem key={index}>
                            <div className="aspect-square relative bg-white">
                                <Image
                                    src={img}
                                    alt={`${product.name} image ${index + 1}`}
                                    fill
                                    className="object-contain"
                                    sizes="100vw"
                                    data-ai-hint={product.dataAiHint}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {product.images.length > 1 && (
                    <>
                        <CarouselPrevious className="left-4" />
                        <CarouselNext className="right-4" />
                    </>
                )}
            </Carousel>
        </div>
        
        <div className="p-4 space-y-4 bg-background">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.unit}</p>

            <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold">₹{price.toFixed(2)}</p>
                {discount > 0 && (
                  <>
                    <p className="text-muted-foreground line-through">MRP ₹{mrp.toFixed(2)}</p>
                    <Badge variant="destructive">{discount}% OFF</Badge>
                  </>
                )}
            </div>
            
             <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 text-sm font-semibold text-blue-600 data-[state=open]:text-red-600">
                    <span className="data-[state=closed]:block data-[state=open]:hidden">View product details</span>
                    <span className="data-[state=open]:block data-[state=closed]:hidden">Hide product details</span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <p className="text-muted-foreground text-sm mt-2">{product.description}</p>
                </CollapsibleContent>
            </Collapsible>
        </div>

        {similarProducts.length > 0 && (
            <div className="bg-background">
                 <ProductCarousel title="Similar Products" products={similarProducts} />
            </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-24 p-4">
          <div className="flex-1">
             <p className="font-bold text-xl">₹{price.toFixed(2)}</p>
             <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>
          </div>
          {quantityInCart === 0 ? (
                <Button size="lg" className="h-12 w-40 text-base" onClick={handleAddToCart}>
                    Add to Cart
                </Button>
            ) : (
                <div className="flex items-center gap-2 rounded-lg border bg-primary text-primary-foreground p-1 shadow-sm">
                    <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/80" onClick={handleDecrease}>
                        <Minus className="h-5 w-5" />
                    </Button>
                    <span className="w-10 text-center font-bold text-lg tabular-nums">{quantityInCart}</span>
                    <Button size="icon" variant="ghost" className="h-9 w-9 hover:bg-primary/80" onClick={handleIncrease}>
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
      </footer>
    </div>
  );
}
