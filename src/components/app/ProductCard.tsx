
"use client"
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Clock } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const displayPrice = user?.role === 'wholesaler' || user?.role === 'developer' 
    ? product.wholesalePrice 
    : product.retailPrice;
    
  const mrp = product.retailPrice > displayPrice ? product.retailPrice : displayPrice * 1.25;
  const discount = mrp > displayPrice ? Math.round(((mrp - displayPrice) / mrp) * 100) : 0;
  
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1, product.stock);
  };

  return (
    <Link href={`/products/${product.id}`} className="block w-40 flex-shrink-0">
      <div className="bg-card rounded-lg p-2.5 h-full flex flex-col border border-gray-200/80">
        <div className="relative">
            <div className="aspect-square relative">
                <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="20vw"
                data-ai-hint={product.dataAiHint}
                />
            </div>
            {discount > 0 && (
                <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-tl-md rounded-br-md">
                    {discount}% OFF
                </div>
            )}
             <div className="absolute bottom-[-10px] right-1">
                <Button
                    size="sm"
                    className="bg-green-100 text-green-800 font-bold hover:bg-green-200 border-2 border-green-600 h-8 rounded-lg shadow-md px-5"
                    onClick={handleAddToCart}
                    aria-label="Add to Cart"
                >
                    ADD
                </Button>
            </div>
        </div>
        
        <div className="mt-4 flex-grow flex flex-col">
            <p className="text-xs text-gray-500 truncate">{product.unit}</p>
            <h3 className="font-medium text-sm leading-tight mt-1 flex-grow h-10 line-clamp-2">
                {product.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Clock className="w-3 h-3 text-blue-600"/>
                <span>15 MINS</span>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div>
                    <p className="text-sm font-bold">₹{displayPrice.toFixed(0)}</p>
                    {mrp > displayPrice && <p className="text-xs text-gray-500 line-through">₹{mrp.toFixed(0)}</p>}
                </div>
            </div>
        </div>
      </div>
    </Link>
  );
}
