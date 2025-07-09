
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams, notFound } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getProductById, getCategories, updateProduct } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "@/components/app/ProductForm";
import { Button } from "@/components/ui/button";

export default function EditItemPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }
        if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
            toast({ title: "Access Denied", description: "This page is for administrators only.", variant: "destructive" });
            router.push("/");
            return;
        }

        const productId = params.id as string;
        const fetchData = async () => {
            try {
                const [foundProduct, allCategories] = await Promise.all([
                    getProductById(productId),
                    getCategories(),
                ]);

                if (foundProduct) {
                    setProduct(foundProduct);
                    setCategories(allCategories);
                } else {
                    notFound();
                }
            } catch (error) {
                console.error("Failed to fetch product data", error);
                toast({ title: "Error", description: "Failed to load product data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [user, router, toast, params.id]);

    const handleFormSubmit = async (data: any, images: string[]) => {
        if (!product) return;
        setIsSubmitting(true);
        
        const imageChanged = JSON.stringify(images) !== JSON.stringify(product.images.filter(img => !img.includes('placehold.co')));
        const updatedProductData: Product = {
            ...product,
            ...data,
            images,
            imageUpdatedAt: imageChanged ? new Date().toISOString() : product.imageUpdatedAt,
        };

        try {
            await updateProduct(updatedProductData);
            toast({
                title: "Product Updated",
                description: `${data.name} has been updated.`,
            });
            router.push('/developer/products');
        } catch (error) {
            console.error("Failed to update product", error);
            toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-12">
                <Card className="max-w-3xl mx-auto">
                    <CardHeader><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" /></CardHeader>
                    <CardContent className="space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!product) {
        return null; // notFound() is called in useEffect
    }

    return (
        <div className="container py-12">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>Update the details for &quot;{product.name}&quot;.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ProductForm 
                        product={product}
                        categories={categories}
                        onFormSubmit={handleFormSubmit}
                        isSubmitting={isSubmitting}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
