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

export default function ProfilePage() {
  const { user, upgradeToWholesaler, loading: authLoading } = useAuth();
  const [upgradeCode, setUpgradeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await upgradeToWholesaler(upgradeCode);
    if (success) {
      toast({
        title: "Upgrade Successful!",
        description: "You now have access to wholesale pricing.",
      });
      setUpgradeCode("");
    } else {
      toast({
        title: "Upgrade Failed",
        description: "The upgrade code is incorrect.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

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
            <CardDescription>Manage your account information.</CardDescription>
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
                <p>
                    <Badge variant={user.role === 'wholesaler' ? "default" : "secondary" } className="text-lg capitalize">
                        {user.role}
                    </Badge>
                </p>
            </div>
          </CardContent>
        </Card>

        {user.role === 'basic' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Upgrade to Wholesaler</CardTitle>
              <CardDescription>Enter your unique code to unlock wholesale pricing.</CardDescription>
            </CardHeader>
            <form onSubmit={handleUpgrade}>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="upgrade-code">Upgrade Code</Label>
                        <Input
                            id="upgrade-code"
                            value={upgradeCode}
                            onChange={(e) => setUpgradeCode(e.target.value)}
                            placeholder="Enter code"
                            disabled={loading}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upgrade Account
                    </Button>
                </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
