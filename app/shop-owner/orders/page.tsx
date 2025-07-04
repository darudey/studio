
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
import { useToast } from "@/hooks/use-toast";

interface CustomerWithOrderInfo extends User {
  orderCount: number;
  lastOrderDate: string;
}

export default function CustomersWithOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithOrderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      // First, wait for the authentication status to be resolved.
      if (authLoading) {
        return;
      }

      // If auth is resolved and there is no user, redirect to login.
      if (!user) {
        router.push("/login");
        return;
      }

      // If there is a user, check their role for permission to view this page.
      if (!['developer', 'shop-owner'].includes(user.role)) {
        router.push("/");
        return;
      }

      // Only after all authentication and permission checks pass, attempt to fetch data.
      try {
        const [allOrders, allUsers] = await Promise.all([getAllOrders(), getUsers()]);
        
        const usersById = new Map(allUsers.map(user => [user.id, user]));
        const customerOrderInfo = new Map<string, { orderCount: number; lastOrderDate: string }>();

        for (const order of allOrders) {
            const info = customerOrderInfo.get(order.userId) || { orderCount: 0, lastOrderDate: '1970-01-01T00:00:00.000Z' };
            info.orderCount++;
            if (order.date > info.lastOrderDate) {
                info.lastOrderDate = order.date;
            }
            customerOrderInfo.set(order.userId, info);
        }

        const customerList: CustomerWithOrderInfo[] = Array.from(customerOrderInfo.entries())
            .map(([userId, info]) => {
                const customer = usersById.get(userId);
                if (!customer) return null;
                return { ...customer, ...info };
            })
            .filter((c): c is CustomerWithOrderInfo => c !== null)
            .sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
            
        setCustomers(customerList);
      } catch (error) {
        if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
            console.error("Firestore Security Rules Error: The current user does not have permission to list all orders and users. Please update your firestore.rules to allow 'list' access for shop-owner and developer roles on the 'orders' and 'users' collections.", error);
            toast({
                title: "Permission Denied",
                description: "You do not have permission to view all orders. Please contact an administrator.",
                variant: "destructive"
            });
        } else {
            console.error("Failed to fetch customer orders:", error);
            toast({
                title: "Error",
                description: "Could not load customer orders.",
                variant: "destructive"
            });
        }
      } finally {
        // Ensure the loading spinner is turned off, regardless of success or a permission error.
        setLoading(false);
      }
    };

    checkAuthAndFetch();

  }, [user, authLoading, router, toast]);
  
  if (loading || authLoading) {
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
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Last Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium truncate">{customer.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                    </TableCell>
                    <TableCell className="text-center">{customer.orderCount}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{new Date(customer.lastOrderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/shop-owner/orders/${customer.id}`}>
                          <Eye className="h-4 w-4 text-blue-600 sm:mr-2" />
                          <span className="hidden sm:inline">View Orders</span>
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
