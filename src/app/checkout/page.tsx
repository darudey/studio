"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { addOrder, products as allProducts } from "@/lib/data";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartDetails, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();

  const getPrice = (product: Product) => {
    if (user?.role === 'wholesaler' || user?.role === 'developer') {
      return product.wholesalePrice;
    }
    return product.retailPrice;
  };
  
  const total = cartDetails.reduce((acc, item) => {
    if (!item.product) return acc;
    return acc + getPrice(item.product) * item.quantity;
  }, 0);

  const handlePlaceOrder = () => {
    if (!user) {
      toast({ title: "Please login to place an order.", variant: "destructive" });
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cartDetails.length === 0) {
      toast({ title: "Your cart is empty.", variant: "destructive" });
      return;
    }

    addOrder({
      userId: user.id,
      items: cartDetails.map(item => ({
        productId: item.productId,
        name: item.product!.name,
        quantity: item.quantity,
        price: getPrice(item.product!),
      })),
      total: total,
      status: 'Pending',
      shippingAddress: user.address,
    });

    clearCart();
    toast({ title: "Order Placed!", description: "Thank you for your purchase." });
    router.push("/orders");
  };

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
                            {cartDetails.map(({ product, quantity }) =>
                                product ? (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <Image src={product.images[0]} alt={product.name} width={64} height={64} className="rounded-md object-cover"/>
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{quantity}</TableCell>
                                    <TableCell>${getPrice(product).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">${(getPrice(product) * quantity).toFixed(2)}</TableCell>
                                </TableRow>
                                ) : null
                            )}
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
                        <span>${total.toFixed(2)}</span>
                    </div>
                     <p className="text-sm text-muted-foreground">Shipping and taxes will be calculated at the next step.</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
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
