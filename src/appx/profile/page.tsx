
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
        <div className="container py-12">
            <div className="mx-auto max-w-2xl">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-3/4" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">My Profile</CardTitle>
            <CardDescription>View your account information and status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <Label>Name</Label>
                <p className="text-lg font-medium">{user.name}</p>
            </div>
             <div>
                <Label>Email</Label>
                <p className="text-lg font-medium">{user.email}</p>
            </div>
             <div>
                <Label>Phone</Label>
                <p className="text-lg font-medium">{user.phone}</p>
            </div>
             <div>
                <Label>Address</Label>
                <p className="text-lg font-medium whitespace-pre-wrap">{user.address}</p>
            </div>
            <div>
                <Label>Account Type</Label>
                <div>
                    <Badge variant={user.role === 'developer' || user.role === 'shop-owner' || user.role === 'imager' ? 'destructive' : user.role === 'wholesaler' ? 'default' : 'secondary'} className="text-lg capitalize">
                        {user.role}
                    </Badge>
                </div>
            </div>
          </CardContent>
          {user.role === 'basic' && (
            <CardFooter>
                 <Button asChild>
                    <Link href="/redeem">Have a coupon? Redeem it here</Link>
                 </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
