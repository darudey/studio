"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { orders as allOrders, users as allUsers, updateProduct } from "@/lib/data";
import type { Order, User, Product } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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
      setFilteredOrders(enriched);
    }
  }, [user, router]);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.status.toLowerCase() === statusFilter));
    }
  }, [statusFilter, orders]);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
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
  }


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
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Customer Details</h4>
                                    <div className="text-sm space-y-1 text-muted-foreground p-4 border rounded-md bg-background">
                                        <p><strong className="text-foreground font-medium">Name:</strong> {order.user?.name}</p>
                                        <p><strong className="text-foreground font-medium">Email:</strong> {order.user?.email}</p>
                                        <p><strong className="text-foreground font-medium">Phone:</strong> {order.user?.phone}</p>
                                        <p><strong className="text-foreground font-medium">Address:</strong> {order.shippingAddress}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Update Status</h4>
                                     <Select onValueChange={(value: Order['status']) => handleStatusChange(order.id, value)} defaultValue={order.status}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Update order status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
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
