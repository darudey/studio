
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getNotificationsForUser, markUserNotificationsAsRead } from "@/lib/data";
import { Notification } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login?redirect=/notifications");
      return;
    }
    
    const fetchAndReadNotifications = async () => {
      setLoading(true);
      try {
        const userNotifications = await getNotificationsForUser(user.id);
        setNotifications(userNotifications);
        // Mark as read after fetching and displaying
        if (userNotifications.some(n => !n.isRead)) {
            await markUserNotificationsAsRead(user.id);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndReadNotifications();

  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="container py-12">
        <Card className="max-w-4xl mx-auto">
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
            Here are your latest updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map(notification => (
                <Link key={notification.id} href={notification.link} className="block">
                    <div className={cn("border p-4 rounded-lg hover:bg-muted transition-colors flex items-center justify-between", !notification.isRead && "bg-blue-50/50 border-blue-200 dark:bg-blue-900/20")}>
                        <div>
                            <p className="font-medium">
                                {notification.message}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              You have no notifications.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
