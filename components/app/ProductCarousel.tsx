
"use client";

import { Product } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "./ProductCard";

interface ProductCarouselProps {
    title: string;
    products: Product[];
    loadingProductId: string | null;
    onProductClick: (productId: string) => void;
    categorySettingsMap: Record<string, string>;
}

export default function ProductCarousel({ title, products, loadingProductId, onProductClick, categorySettingsMap }: ProductCarouselProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight mb-4">{title}</h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: products.length > 3,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {products.map((product) => (
                        <CarouselItem key={product.id} className="basis-1/2 sm:basis-1/3 pl-4">
                            <div className="h-full">
                                <ProductCard 
                                    product={product} 
                                    isLoading={loadingProductId === product.id}
                                    onClick={() => onProductClick(product.id)}
                                    placeholderImageUrl={categorySettingsMap[product.category]}
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    );
}
