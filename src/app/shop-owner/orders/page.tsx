"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orders as allOrders, users as allUsers } from "@/lib/data";
import type { User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface CustomerWithOrderInfo extends User {
  orderCount: number;
  lastOrderDate: string;
}

export default function CustomersWithOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!['developer', 'shop-owner'].includes(user.role)) {
      router.push("/");
    }
  }, [user, router]);

  const customers = useMemo(() => {
    const ordersByUser = allOrders.reduce((acc, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = [];
      }
      acc[order.userId].push(order);
      return acc;
    }, {} as Record<string, typeof allOrders>);

    const customerList: CustomerWithOrderInfo[] = Object.keys(ordersByUser)
      .map(userId => {
        const customer = allUsers.find(u => u.id === userId);
        if (!customer) return null;

        const userOrders = ordersByUser[userId];
        const lastOrder = userOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        return {
          ...customer,
          orderCount: userOrders.length,
          lastOrderDate: lastOrder.date,
        };
      })
      .filter((c): c is CustomerWithOrderInfo => c !== null)
      .sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
      
    return customerList;
  }, []);
  
  if (!user || !['developer', 'shop-owner'].includes(user.role)) {
    return <div className="container text-center py-10">Loading...</div>;
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>View customers who have placed orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Total Orders</TableHead>
                  <TableHead className="text-center">Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell className="text-center">{customer.orderCount}</TableCell>
                    <TableCell className="text-center">{new Date(customer.lastOrderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/shop-owner/orders/${customer.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Orders
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              No customers have placed orders yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
