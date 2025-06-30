
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addCoupon, getUnusedCoupons } from "@/lib/data";
import { Coupon } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManageCouponsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleToGenerate, setRoleToGenerate] = useState<'shop-owner' | 'wholesaler'>('wholesaler');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== 'developer') {
      toast({ title: "Access Denied", description: "This page is for developers only.", variant: "destructive" });
      router.push("/");
      return;
    }
    
    getUnusedCoupons().then(fetchedCoupons => {
      setCoupons(fetchedCoupons);
      setLoading(false);
    }).catch(err => {
        toast({ title: "Error", description: "Failed to load coupons.", variant: "destructive" });
        setLoading(false);
    });

  }, [user, router, toast]);

  const handleGenerateCoupon = async () => {
    if (!user) return;
    setIsGenerating(true);

    // Simplified coupon code generation
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        const newCouponData: Omit<Coupon, 'id'> = {
            code: newCode,
            role: roleToGenerate,
            isUsed: false,
            createdAt: new Date().toISOString(),
            createdBy: user.id
        }
        const addedCoupon = await addCoupon(newCouponData);
        setCoupons(prev => [addedCoupon, ...prev]);
        toast({
            title: "Coupon Generated",
            description: `New ${roleToGenerate} coupon: ${newCode}`
        })
    } catch (error) {
        console.error("Failed to generate coupon", error);
        toast({ title: "Error", description: "Could not generate coupon.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${text} copied to clipboard.` });
  }

  if (loading) {
    return (
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                  <Card>
                    <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                  </Card>
              </div>
              <div className="md:col-span-2">
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
          </div>
        </div>
      );
  }

  return (
    <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Generate New Coupon</CardTitle>
                        <CardDescription>Create a new single-use coupon to upgrade a user's role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Role to Grant</label>
                            <Select value={roleToGenerate} onValueChange={(value: 'shop-owner' | 'wholesaler') => setRoleToGenerate(value)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                                    <SelectItem value="shop-owner">Shop Owner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full" onClick={handleGenerateCoupon} disabled={isGenerating}>
                            {isGenerating && <Ticket className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Coupon
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                 <Card>
                    <CardHeader>
                    <CardTitle>Unused Coupons</CardTitle>
                    <CardDescription>These are the currently active coupons that have not been redeemed yet.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Grants Role</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {coupons.map((c) => (
                            <TableRow key={c.id}>
                            <TableCell className="font-mono">{c.code}</TableCell>
                            <TableCell>
                                <Badge variant={c.role === 'shop-owner' ? 'destructive' : 'default'}>{c.role}</Badge>
                            </TableCell>
                            <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(c.code)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
