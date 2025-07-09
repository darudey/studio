
"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "../ui/scroll-area";
import Image from "next/image";
import { Input } from "../ui/input";
import { Trash2 } from "lucide-react";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/types";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { useRouter } from "next/navigation";
import { CategoryIconAsImage } from "@/lib/icons";
import { useCategorySettings } from "@/context/CategorySettingsContext";

export default function ShoppingCartSheet({ children }: { children: React.ReactNode }) {
  const { cartDetails, updateQuantity, removeFromCart, loading: cartLoading, cartCount, updateItemNote } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { settingsMap } = useCategorySettings();

  const getPrice = (product: Product) => {
      if (user?.role === 'wholesaler' || user?.role === 'developer') {
          return product.wholesalePrice;
      }
      return product.retailPrice;
  }

  const total = cartDetails.reduce((acc, item) => {
    if (!item.product) return acc;
    return acc + getPrice(item.product) * item.quantity;
  }, 0);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      router.prefetch('/checkout');
    }
  };


  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Shopping Cart ({cartCount})</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartLoading ? (
            <div className="p-6 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        ) : cartDetails.length > 0 ? (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-4 p-6">
                {cartDetails.map(({ product, quantity, note }) => {
                  const imageUrl = product?.images?.[0];
                  const isPlaceholder = !imageUrl || imageUrl.includes('placehold.co');
                  
                  return product ? (
                    <div key={product.id} className="grid grid-cols-[auto_1fr] gap-4 items-start border-b pb-4">
                        <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                            {isPlaceholder ? (
                                <CategoryIconAsImage category={product.category} imageUrl={settingsMap[product.category]}/>
                            ) : (
                                <Image
                                    src={imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={product.dataAiHint}
                                    sizes="80px"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <h3 className="font-medium pr-2 leading-tight">{product.name}</h3>
                                <p className="font-semibold shrink-0">₹{(getPrice(product) * quantity).toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground -mt-1">
                                Price: ₹{getPrice(product).toFixed(2)}
                            </p>
                            <div className="flex items-center space-x-2">
                                <label htmlFor={`quantity-${product.id}`} className="text-sm font-medium">Qty:</label>
                                <Input
                                    id={`quantity-${product.id}`}
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0, product.stock)}
                                    className="h-8 w-16"
                                    min="0"
                                    max={product.stock}
                                />
                                <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)} aria-label="Remove item">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                            <Textarea
                                placeholder="Add a note..."
                                value={note || ""}
                                onChange={(e) => updateItemNote(product.id, e.target.value)}
                                className="h-16 text-xs"
                                rows={2}
                            />
                        </div>
                    </div>
                  ) : null
                })}
              </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="p-6">
              <div className="w-full space-y-4">
                 <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                 </div>
                 <SheetClose asChild>
                    <Button asChild className="w-full">
                        <Link href="/checkout">Proceed to Checkout</Link>
                    </Button>
                 </SheetClose>
              </div>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4">
            <p className="text-muted-foreground">Your cart is empty.</p>
            <SheetTrigger asChild>
              <SheetClose asChild>
                <Button asChild variant="outline">
                    <Link href="/">Continue Shopping</Link>
                </Button>
              </SheetClose>
            </SheetTrigger>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
