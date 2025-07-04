"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAllOrders, getUsers } from "@/lib/data";
import { Order, User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, BellRing } from "lucide-react";

type OrderWithCustomer = Order & { customer?: User };

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?redirect=/notifications");
      return;
    }
    if (!['developer', 'shop-owner'].includes(user.role)) {
      router.push("/");
      return;
    }

    // When this page is viewed, update the timestamp to 'clear' notifications.
    localStorage.setItem('lastCheckedOrdersTimestamp', new Date().toISOString());

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const [allOrders, allUsers] = await Promise.all([getAllOrders(), getUsers()]);
        const usersMap = new Map(allUsers.map(u => [u.id, u]));
        
        const ordersWithCustomerInfo = allOrders.map(order => ({
          ...order,
          customer: usersMap.get(order.userId),
        }));
        
        setNotifications(ordersWithCustomerInfo);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();

  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-blue-600" />
            Notifications
          </CardTitle>
          <CardDescription>
            Here are the latest updates and orders from your customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map(order => (
                <Link key={order.id} href={`/shop-owner/orders/${order.userId}`} className="block">
                    <div className="border p-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-between">
                        <div>
                            <p className="font-medium">
                                New order from <span className="text-blue-600">{order.customer?.name || 'A customer'}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Total: ₹{order.total.toFixed(2)} &bull; {formatDistanceToNow(new Date(order.date), { addSuffix: true })}
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              You have no new notifications.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
