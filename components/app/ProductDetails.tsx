
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import type { Product } from "@/types";
import { Minus, Plus, ChevronDown } from "lucide-react";
import ProductCarousel from "@/components/app/ProductCarousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CategoryIconAsImage } from "@/lib/icons";
import { useCategorySettings } from "@/context/CategorySettingsContext";

interface ProductDetailsProps {
    product: Product;
    similarProducts: Product[];
}

export default function ProductDetails({ product, similarProducts }: ProductDetailsProps) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { user } = useAuth();
  
  const [loadingProduct, setLoadingProduct] = useState<string | null>(null);
  const { settingsMap } = useCategorySettings();

  const cartItem = cartItems.find(item => item.productId === product.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product.id, 1, product.stock);
  };
  
  const handleIncrease = () => {
    addToCart(product.id, 1, product.stock);
  };

  const handleDecrease = () => {
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1, product.stock);
    }
  };

  const handleProductClick = (productId: string) => {
    setLoadingProduct(productId);
  };

  const displayPrice = user?.role === 'wholesaler' || user?.role === 'developer' ? product.wholesalePrice : product.retailPrice;

  let priceToShowStrikethrough: number | undefined = undefined;
  if (product.mrp && product.mrp > displayPrice) {
      priceToShowStrikethrough = product.mrp;
  } else if (!product.mrp && product.retailPrice > displayPrice) {
      priceToShowStrikethrough = product.retailPrice;
  }

  const discount = priceToShowStrikethrough ? Math.round(((priceToShowStrikethrough - displayPrice) / priceToShowStrikethrough) * 100) : 0;
  
  const displayImages = product.images.filter(img => !img.includes('placehold.co'));

  return (
    <div className="pb-32"> {/* Padding bottom to make space for sticky footer */}
      <div className="max-w-4xl mx-auto">
        <div className="w-full">
            {displayImages.length > 0 ? (
                <Carousel>
                    <CarouselContent>
                        {displayImages.map((img, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-square relative bg-white">
                                    <Image
                                        src={img}
                                        alt={`${product.name} image ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="100vw"
                                        data-ai-hint={product.dataAiHint}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {displayImages.length > 1 && (
                        <>
                            <CarouselPrevious className="left-4" />
                            <CarouselNext className="right-4" />
                        </>
                    )}
                </Carousel>
            ) : (
                <div className="aspect-square relative bg-white border rounded-md">
                    <CategoryIconAsImage category={product.category} imageUrl={settingsMap[product.category]} />
                </div>
            )}
        </div>
        
        <div className="p-4 space-y-4 bg-background">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground">{product.unit}</p>

            <div className="flex items-center gap-2 flex-wrap">
                <p className="text-2xl font-bold">₹{displayPrice.toFixed(2)}</p>
                {priceToShowStrikethrough && discount > 0 && (
                  <>
                    <p className="text-muted-foreground line-through">MRP ₹{priceToShowStrikethrough.toFixed(2)}</p>
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
            <div className="bg-background py-6 px-4">
                 <ProductCarousel 
                    title="Similar Products" 
                    products={similarProducts} 
                    loadingProductId={loadingProduct}
                    onProductClick={handleProductClick}
                    categorySettingsMap={settingsMap}
                />
            </div>
        )}
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-24 p-4">
          <div className="flex-1">
             <p className="font-bold text-xl">₹{displayPrice.toFixed(2)}</p>
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
