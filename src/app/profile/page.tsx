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

export default function ProfilePage() {
  const { user, upgradeToWholesaler } = useAuth();
  const [upgradeCode, setUpgradeCode] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    const success = upgradeToWholesaler(upgradeCode);
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
  };

  if (!user) {
    return <div className="container text-center py-10">Loading...</div>;
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
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit">Upgrade Account</Button>
                </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
