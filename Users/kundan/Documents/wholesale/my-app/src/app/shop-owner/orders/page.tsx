
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCustomerOrderInfo } from "@/hooks/use-swr-data";
import { Progress } from "@/components/ui/progress";

export default function CustomersWithOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { customers, isLoading, error } = useCustomerOrderInfo();
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    if (isLoading || authLoading) {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, authLoading]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner'].includes(user.role)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (error) {
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
    }
  }, [error, toast]);
  
  if (isLoading || authLoading) {
    return (
        <div className="container py-12">
          <Progress value={progress} className="w-[60%] mx-auto mb-8" />
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
          {customers && customers.length > 0 ? (
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
