
"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { addOrder } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CategoryIconAsImage } from "@/lib/icons";
import { useCategorySettings } from "@/context/CategorySettingsContext";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartDetails, clearCart, loading: cartLoading } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { settingsMap, loading: settingsLoading } = useCategorySettings();

  const total = cartDetails.reduce((acc, item) => {
    return acc + item.price * item.quantity;
  }, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({ title: "Please login to place an order.", variant: "destructive" });
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cartDetails.length === 0) {
      toast({ title: "Your cart is empty.", variant: "destructive" });
      return;
    }

    setIsPlacingOrder(true);
    try {
        const orderItems = cartDetails.map(item => {
            if (!item.product) throw new Error("Product details missing in cart");
            return {
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              status: 'Pending' as const,
              ...(item.note && { note: item.note }),
            }
        });

        await addOrder({
          userId: user.id,
          items: orderItems,
          total: total,
          status: 'Pending',
          shippingAddress: user.address,
        });

        clearCart();
        toast({ title: "Order Placed!", description: "Thank you for your purchase." });
        router.push("/orders");
    } catch (error) {
        console.error("Failed to place order:", error);
        toast({
            title: "Order Failed",
            description: "An unexpected error occurred while placing your order. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsPlacingOrder(false);
    }
  };

  if (cartLoading || settingsLoading) {
    return (
        <div className="container py-12">
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-12 w-1/2" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    )
  }

  if (cartDetails.length === 0) {
    return (
      <div className="container py-12 text-center">
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Your Cart is Empty</CardTitle>
                <CardDescription>You have no items in your shopping cart.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>Review the items in your cart before placing your order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Product</TableHead>
                                <TableHead></TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {cartDetails.map(({ product, quantity, note, price, name, wholesaleUnit }) => {
                                const imageUrl = product?.images?.[0];
                                const isPlaceholder = !imageUrl || imageUrl.includes('placehold.co');
                                return product ? (
                                <TableRow key={`${product.id}-${wholesaleUnit || 'retail'}`}>
                                    <TableCell className="w-[80px]">
                                        <div className="aspect-square relative">
                                            {isPlaceholder ? (
                                                <CategoryIconAsImage category={product.category} imageUrl={settingsMap[product.category]} />
                                            ) : (
                                                <Image src={imageUrl} alt={product.name} fill className="rounded-md object-cover"/>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium align-top">
                                        {name}
                                        {note && (
                                            <p className="text-xs text-muted-foreground font-normal mt-1 italic">Note: {note}</p>
                                        )}
                                    </TableCell>
                                    <TableCell>{quantity}</TableCell>
                                    <TableCell>₹{price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">₹{(price * quantity).toFixed(2)}</TableCell>
                                </TableRow>
                                ) : null
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Order Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                     <p className="text-sm text-muted-foreground">Shipping and taxes will be calculated at the next step.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                        {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Place Order
                    </Button>
                </CardFooter>
            </Card>
            {user && (
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping To</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{user.address}</p>
                        <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
