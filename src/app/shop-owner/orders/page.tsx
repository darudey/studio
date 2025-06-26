"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { orders as allOrders, users as allUsers } from "@/lib/data";
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

type EnrichedOrder = Order & { user: User | undefined };

export default function AllOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<EnrichedOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!['developer', 'shop-owner'].includes(user.role)) {
      router.push("/");
    } else {
      const enriched = allOrders.map(order => ({
        ...order,
        user: allUsers.find(u => u.id === order.userId)
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(enriched);
    }
  }, [user, router]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status.toLowerCase() === statusFilter));
    }
  }, [statusFilter, orders]);
  
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

  const handleUpdateOrder = (orderId: string, action: 'ship' | 'cancel') => {
      const orderIndex = allOrders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return;

      const currentOrderInState = orders.find(o => o.id === orderId);
      if (!currentOrderInState) return;

      let toastTitle = "";
      let toastDescription = "";

      if (action === 'ship') {
          allOrders[orderIndex].status = 'Shipped';
          allOrders[orderIndex].items = currentOrderInState.items.map(item => ({
              ...item,
              status: item.status === 'Pending' ? 'Fulfilled' : item.status
          }));
          
          const fulfilledCount = allOrders[orderIndex].items.filter(i => i.status === 'Fulfilled').length;
          const cancelledCount = allOrders[orderIndex].items.filter(i => i.status === 'Cancelled').length;

          toastTitle = "Order Packed and Shipped";
          toastDescription = `Order #${orderId} is now shipped. ${fulfilledCount} items fulfilled, ${cancelledCount} items cancelled.`;
      } else if (action === 'cancel') {
          allOrders[orderIndex].status = 'Cancelled';
          allOrders[orderIndex].items.forEach(item => item.status = 'Cancelled');
          toastTitle = "Order Cancelled";
          toastDescription = `Order #${orderId} has been cancelled.`;
      }
      
      const enriched = allOrders.map(o => ({...o, user: allUsers.find(u => u.id === o.userId)})).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(enriched);
      
      toast({ title: toastTitle, description: toastDescription });
  };
  
  const handleDeliveryStatusChange = (orderId: string, newStatus: 'Shipped' | 'Delivered') => {
       const orderIndex = allOrders.findIndex(o => o.id === orderId);
       if(orderIndex !== -1) {
          allOrders[orderIndex].status = newStatus;
          const enriched = allOrders.map(order => ({
              ...order,
              user: allUsers.find(u => u.id === order.userId)
          })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setOrders(enriched);
          toast({ title: "Order Status Updated", description: `Order #${orderId} is now ${newStatus}.`});
      }
  };

  if (!user || !['developer', 'shop-owner'].includes(user.role)) {
    return <div className="container text-center py-10">Loading...</div>;
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Customer Orders</CardTitle>
              <CardDescription>View and manage all orders placed in the store.</CardDescription>
            </div>
            <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredOrders.map(order => (
                <AccordionItem value={order.id} key={order.id}>
                    <AccordionTrigger>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-left md:items-center w-full pr-4 text-sm">
                            <span className="font-medium text-left">Order #{order.id}</span>
                            <span className="text-muted-foreground md:text-foreground text-left truncate">{order.user?.name || 'Unknown User'}</span>
                            <span className="text-left md:text-center">{new Date(order.date).toLocaleDateString()}</span>
                            <Badge variant={order.status === 'Delivered' ? 'default' : 'secondary'} className="w-fit md:justify-self-center">{order.status}</Badge>
                            <span className="font-semibold text-left md:text-right">${order.total.toFixed(2)}</span>
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
                                                <TableCell>${item.price.toFixed(2)}</TableCell>
                                                <TableCell className={cn(item.status === 'Cancelled' && 'line-through text-muted-foreground')}>${(item.quantity * item.price).toFixed(2)}</TableCell>
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
                                        <p><strong className="text-foreground font-medium">Name:</strong> {order.user?.name}</p>
                                        <p><strong className="text-foreground font-medium">Email:</strong> {order.user?.email}</p>
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
              No orders found with the selected status.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
