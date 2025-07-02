
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllOrders, getUsers } from "@/lib/data";
import type { User, Order } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomerWithOrderInfo extends User {
  orderCount: number;
  lastOrderDate: string;
}

export default function CustomersWithOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithOrderInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner'].includes(user.role)) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
        const [allOrders, allUsers] = await Promise.all([getAllOrders(), getUsers()]);
        
        const ordersByUser = allOrders.reduce((acc, order) => {
            if (!acc[order.userId]) {
                acc[order.userId] = [];
            }
            acc[order.userId].push(order);
            return acc;
            }, {} as Record<string, Order[]>);

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
            
        setCustomers(customerList);
        setLoading(false);
    }
    fetchData();

  }, [user, router]);
  
  if (loading) {
    return (
        <div className="container py-12">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            </CardContent>
          </Card>
        </div>
      );
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
                          <Eye className="mr-2 h-4 w-4 text-blue-600" />
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
