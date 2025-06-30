
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function RedeemPage() {
  const { user, redeemUpgradeCode, loading: authLoading } = useAuth();
  const [upgradeCode, setUpgradeCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/redeem");
    } else if (!authLoading && user && user.role !== 'basic') {
      toast({
        title: "Account Already Upgraded",
        description: "Only basic accounts can redeem coupons.",
        variant: "default",
      });
      router.push('/profile');
    }
  }, [user, authLoading, router, toast]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const result = await redeemUpgradeCode(upgradeCode);
    if (result.success) {
      toast({
        title: "Upgrade Successful!",
        description: result.message,
      });
      setUpgradeCode("");
      router.push('/profile');
    } else {
      toast({
        title: "Upgrade Failed",
        description: result.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };
  
  if (authLoading || !user || user.role !== 'basic') {
      return (
        <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <form onSubmit={handleRedeem}>
          <CardHeader>
            <CardTitle>Redeem a Coupon</CardTitle>
            <CardDescription>Enter a code to upgrade your account role (e.g., to Wholesaler).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Label htmlFor="upgrade-code">Coupon Code</Label>
                <Input
                    id="upgrade-code"
                    value={upgradeCode}
                    onChange={(e) => setUpgradeCode(e.target.value)}
                    placeholder="Enter your code"
                    disabled={loading}
                    required
                />
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-4">
              <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Redeem Code
              </Button>
              <Button variant="link" asChild>
                <Link href="/profile">Cancel</Link>
              </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
