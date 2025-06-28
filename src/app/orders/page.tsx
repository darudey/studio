"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getOrdersByUserId } from "@/lib/data";
import { Order } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    
    setLoading(true);
    getOrdersByUserId(user.id)
      .then(orders => {
        setUserOrders(orders);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch orders:", err);
        setLoading(false);
      });

  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
        <div className="container py-12">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View your past orders and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          {userOrders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {userOrders.map(order => (
                <AccordionItem value={order.id} key={order.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4 text-sm">
                            <span>Order #{order.id.substring(0,6)}...</span>
                            <span>{new Date(order.date).toLocaleDateString()}</span>
                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'}>{order.status}</Badge>
                            <span>${order.total.toFixed(2)}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Subtotal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>${item.price.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${(item.quantity * item.price).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              You have not placed any orders yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
