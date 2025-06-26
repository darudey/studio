"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addProduct, products } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Product } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(2, { message: "Category is required." }),
  retailPrice: z.coerce.number().min(0.01, { message: "Retail price must be positive." }),
  wholesalePrice: z.coerce.number().min(0.01, { message: "Wholesale price must be positive." }),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
});

export default function AddItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== 'developer') {
      toast({ title: "Access Denied", description: "This page is for developers only.", variant: "destructive" });
      router.push("/");
    }
  }, [user, router, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      retailPrice: 0,
      wholesalePrice: 0,
      unit: "piece",
      stock: 0,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = (data) => {
    const newProduct: Product = {
      id: (products.length + 2).toString(),
      ...data,
      images: ['https://placehold.co/600x600.png'], // Placeholder image
    };
    addProduct(newProduct);
    toast({
      title: "Product Added",
      description: `${data.name} has been added to the catalog.`,
    });
    form.reset();
  };
  
  if (!user || user.role !== 'developer') {
    return <div className="container text-center py-10">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Add New Product</CardTitle>
                <CardDescription>Fill in the details to add a new item to the grocery catalog.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Fruits" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="retailPrice" render={({ field }) => (
                                <FormItem><FormLabel>Retail Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                                <FormItem><FormLabel>Wholesale Price ($)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="unit" render={({ field }) => (
                                <FormItem><FormLabel>Measuring Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                        <SelectItem value="g">Gram (g)</SelectItem>
                                        <SelectItem value="litre">Litre (litre)</SelectItem>
                                        <SelectItem value="ml">Millilitre (ml)</SelectItem>
                                        <SelectItem value="piece">Piece</SelectItem>
                                        <SelectItem value="dozen">Dozen</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="stock" render={({ field }) => (
                                <FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <Button type="submit">Add Product</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
