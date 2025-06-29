"use client";

import { Product } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "./ProductCard";

interface ProductCarouselProps {
    title: string;
    products: Product[];
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <div className="w-full py-6">
            <h2 className="text-2xl font-bold tracking-tight mb-4">{title}</h2>
            <Carousel
                opts={{
                    align: "start",
                    loop: products.length > 6,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-4">
                    {products.map((product) => (
                        <CarouselItem key={product.id} className="basis-[48%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-4">
                            <div className="h-full">
                                <ProductCard product={product} />
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
