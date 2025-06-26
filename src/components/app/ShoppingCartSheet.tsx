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
import { RelatedProducts } from "./RelatedProducts";
import type { Product } from "@/types";

export default function ShoppingCartSheet({ children }: { children: React.ReactNode }) {
  const { cartDetails, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

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


  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Shopping Cart</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartDetails.length > 0 ? (
          <>
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-6 p-6">
                {cartDetails.map(({ product, quantity }) =>
                  product ? (
                    <div key={product.id} className="flex items-center space-x-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-md">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          data-ai-hint={product.dataAiHint}
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${getPrice(product).toFixed(2)}
                        </p>
                        <div className="flex items-center space-x-2">
                           <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value))}
                              className="h-8 w-16"
                              min="1"
                              max={product.stock}
                            />
                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(product.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </div>
                      <p className="font-medium">${(getPrice(product) * quantity).toFixed(2)}</p>
                    </div>
                  ) : null
                )}
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-6">
                <RelatedProducts />
            </div>
            <Separator />
            <SheetFooter className="p-6">
              <div className="w-full space-y-4">
                 <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                 </div>
                 <SheetClose asChild>
                    <Button asChild className="w-full bg-accent hover:bg-accent/90">
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
