
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { getOrdersByUserId, getUserById, updateOrder } from "@/lib/data";
import type { Order, User, OrderItemStatus } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserOrdersPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const userId = params.userId as string;

  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authUser) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner'].includes(authUser.role)) {
      router.push("/");
      return;
    }
    
    const fetchData = async () => {
        try {
            const [foundCustomer, userOrders] = await Promise.all([
                getUserById(userId),
                getOrdersByUserId(userId)
            ]);
            setCustomer(foundCustomer);
            setOrders(userOrders);
        } catch(error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to load order data.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [authUser, router, userId, toast]);

  const handleItemStatusChange = (orderId: string, productId: string, newStatus: OrderItemStatus) => {
    setOrders(currentOrders => 
        currentOrders.map(order => {
            if (order.id === orderId) {
                const updatedItems = order.items.map(item => 
                    item.productId === productId ? { ...item, status: newStatus } : item
                );
                return { ...order, items: updatedItems };
            }
            return order;
        })
    );
  };
  
  const handleUpdateOrder = async (orderId: string, action: 'ship' | 'cancel') => {
      const orderToUpdate = orders.find(o => o.id === orderId);
      if (!orderToUpdate) return;

      let toastTitle = "";
      let toastDescription = "";

      if (action === 'ship') {
          orderToUpdate.status = 'Shipped';
          orderToUpdate.items = orderToUpdate.items.map(item => ({
              ...item,
              status: item.status === 'Pending' ? 'Fulfilled' : item.status
          }));
          
          const fulfilledCount = orderToUpdate.items.filter(i => i.status === 'Fulfilled').length;
          const cancelledCount = orderToUpdate.items.filter(i => i.status === 'Cancelled').length;

          toastTitle = "Order Packed and Shipped";
          toastDescription = `Order #${orderId.substring(0,6)}... is now shipped. ${fulfilledCount} items fulfilled, ${cancelledCount} items cancelled.`;
      } else if (action === 'cancel') {
          orderToUpdate.status = 'Cancelled';
          orderToUpdate.items.forEach(item => item.status = 'Cancelled');
          toastTitle = "Order Cancelled";
          toastDescription = `Order #${orderId.substring(0,6)}... has been cancelled.`;
      }
      
      await updateOrder(orderToUpdate);
      setOrders([...orders]); // Trigger re-render
      
      toast({ title: toastTitle, description: toastDescription });
  };
  
  const handleDeliveryStatusChange = async (orderId: string, newStatus: 'Shipped' | 'Delivered') => {
       const orderToUpdate = orders.find(o => o.id === orderId);
       if(orderToUpdate) {
          orderToUpdate.status = newStatus;
          await updateOrder(orderToUpdate);
          setOrders([...orders]); // Trigger re-render
          toast({ title: "Order Status Updated", description: `Order #${orderId.substring(0,6)}... is now ${newStatus}.`});
      }
  };

  if (loading) {
    return (
        <div className="container py-12">
            <div className="flex items-center mb-6">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-8 w-48 ml-4" />
            </div>
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

  if (!customer) {
    return <div className="container text-center py-10">Customer not found.</div>;
  }

  return (
    <div className="container py-12">
        <div className="flex items-center mb-6">
            <Button variant="outline" size="icon" asChild>
                <Link href="/shop-owner/orders">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to all customers</span>
                </Link>
            </Button>
            <h1 className="text-2xl font-bold ml-4">Orders for {customer.name}</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>View and manage all orders for this customer.</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full" defaultValue={orders[0]?.id}>
                        {orders.map(order => (
                          <AccordionItem value={order.id} key={order.id}>
                              <AccordionTrigger>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left md:items-center w-full pr-4 text-sm">
                                      <span className="font-medium text-left">Order #{order.id.substring(0,6)}...</span>
                                      <span className="text-left md:text-center">{new Date(order.date).toLocaleDateString()}</span>
                                      <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="w-fit md:justify-self-center">{order.status}</Badge>
                                      <span className="font-semibold text-left md:text-right">₹{order.total.toFixed(2)}</span>
                                  </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="grid lg:grid-cols-3 gap-6 pt-4">
                                    <div className="lg:col-span-2">
                                        <h4 className="font-semibold mb-2">Order Items</h4>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Subtotal</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className={cn("font-medium", item.status === 'Cancelled' && 'line-through text-muted-foreground')}>{item.name}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                                        <TableCell className={cn(item.status === 'Cancelled' && 'line-through text-muted-foreground')}>₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <RadioGroup
                                                                value={item.status}
                                                                onValueChange={(value: OrderItemStatus) => handleItemStatusChange(order.id, item.productId, value)}
                                                                disabled={order.status !== 'Pending'}
                                                                className="flex gap-4 justify-end"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Fulfilled" id={`fulfilled-${order.id}-${item.productId}`} />
                                                                    <Label htmlFor={`fulfilled-${order.id}-${item.productId}`}>Done</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="Cancelled" id={`cancelled-${order.id}-${item.productId}`} />
                                                                    <Label htmlFor={`cancelled-${order.id}-${item.productId}`}>Cancel</Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader className="pb-2"><CardTitle className="text-lg">Customer Details</CardTitle></CardHeader>
                                            <CardContent className="text-sm text-muted-foreground space-y-1">
                                                <p><strong className="text-foreground font-medium">Name:</strong> {customer.name}</p>
                                                <p><strong className="text-foreground font-medium">Email:</strong> {customer.email}</p>
                                                <p><strong className="text-foreground font-medium">Address:</strong> {order.shippingAddress}</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="pb-2"><CardTitle className="text-lg">Order Actions</CardTitle></CardHeader>
                                            <CardContent>
                                                {order.status === 'Pending' && (
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <Button className="w-full" onClick={() => handleUpdateOrder(order.id, 'ship')}>Mark as Shipped</Button>
                                                        <Button className="w-full" variant="destructive" onClick={() => handleUpdateOrder(order.id, 'cancel')}>Cancel Order</Button>
                                                    </div>
                                                )}
                                                {(order.status === 'Shipped' || order.status === 'Delivered') && (
                                                    <div>
                                                        <Label>Update Delivery Status</Label>
                                                        <Select onValueChange={(value: 'Shipped' | 'Delivered') => handleDeliveryStatusChange(order.id, value)} defaultValue={order.status}>
                                                            <SelectTrigger className="mt-1">
                                                                <SelectValue placeholder="Update status" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="shipped">Shipped</SelectItem>
                                                                <SelectItem value="delivered">Delivered</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                                {order.status === 'Cancelled' && (
                                                    <Badge variant="destructive" className="text-base font-medium">Order Cancelled</Badge>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                              </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        This customer has not placed any orders yet.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
