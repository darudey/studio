
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getNotificationsForUser, getUsersByIds } from "@/lib/data";
import type { User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      if (authLoading) {
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (!['developer', 'shop-owner'].includes(user.role)) {
        router.push("/");
        return;
      }

      try {
        setLoading(true);
        // 1. Fetch notifications for the admin, which is secure and avoids broad 'list' queries
        const notifications = await getNotificationsForUser(user.id);

        if (notifications.length === 0) {
            setCustomers([]);
            setLoading(false);
            return;
        }

        // 2. Process notifications to aggregate customer data
        const customerInfoMap = new Map<string, { orderCount: number; lastOrderDate: string; }>();
        const customerIds = new Set<string>();

        notifications.forEach(notification => {
            // Extract userId from the link, e.g., /shop-owner/orders/USER_ID
            const pathParts = notification.link.split('/');
            const customerId = pathParts[pathParts.length - 1];

            if (customerId && notification.link.startsWith('/shop-owner/orders/')) {
                customerIds.add(customerId);
                const info = customerInfoMap.get(customerId) || { orderCount: 0, lastOrderDate: '1970-01-01T00:00:00.000Z' };
                info.orderCount++;
                if (notification.createdAt > info.lastOrderDate) {
                    info.lastOrderDate = notification.createdAt;
                }
                customerInfoMap.set(customerId, info);
            }
        });
        
        if (customerIds.size === 0) {
            setCustomers([]);
            setLoading(false);
            return;
        }

        // 3. Fetch user profiles for the customers found
        const users = await getUsersByIds(Array.from(customerIds));
        const usersMap = new Map(users.map(u => [u.id, u]));

        // 4. Combine info into the final list for rendering
        const customerList: CustomerWithOrderInfo[] = Array.from(customerInfoMap.entries())
            .map(([userId, info]) => {
                const customerUser = usersMap.get(userId);
                return customerUser ? {
                    ...customerUser,
                    orderCount: info.orderCount,
                    lastOrderDate: info.lastOrderDate,
                } : null;
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
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
          <CardDescription>View customers who have placed orders. Click a card to see details.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {customers.map((customer) => (
                <Link key={customer.id} href={`/shop-owner/orders/${customer.id}`} className="block">
                    <div className="border p-4 rounded-lg shadow-sm text-left hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex-grow">
                            <div className="font-medium truncate">{customer.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{customer.email}</div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-muted/20 text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span className="font-semibold text-foreground/80">Total Orders:</span>
                                <span>{customer.orderCount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-semibold text-foreground/80">Last Order:</span>
                                <span>{new Date(customer.lastOrderDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </Link>
              ))}
            </div>
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
