
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/lib/data";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Upload, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useAllProducts } from "@/hooks/use-swr-data";
import { Progress } from "@/components/ui/progress";

export default function ManageProductImagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { products, isLoading: productsLoading, mutate: mutateProducts } = useAllProducts();
  const [searchTerm, setSearchTerm] = useState("");
  
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isLoading = authLoading || productsLoading;
  const [progress, setProgress] = useState(13);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))].sort();
  }, [products]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      toast({ title: "Access Denied", description: "This page is for administrators only.", variant: "destructive" });
    }
  }, [user, authLoading, router, toast]);
  
  const productsByCategory = useMemo(() => {
    if (!products || !categories) return {};

    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return categories.reduce((acc, category) => {
        const prodsInCategory = filtered.filter(p => p.category === category);
        if (prodsInCategory.length > 0) {
            acc[category] = prodsInCategory;
        }
        return acc;
    }, {} as Record<string, Product[]>);
  }, [products, categories, searchTerm]);

  const handleImageClick = (product: Product) => {
    if (updatingProductId) return;
    setUpdatingProductId(product.id);
    fileInputRef.current?.click();
  }

  const handleUpdateImage = async (productToUpdate: Product, newImageSrc: string) => {
    const otherImages = productToUpdate.images.slice(1);
    const updatedImages = [newImageSrc, ...otherImages];

    const updatedProductData: Product = {
      ...productToUpdate,
      images: updatedImages,
      imageUpdatedAt: new Date().toISOString(),
    };

    try {
        await updateProduct(updatedProductData);
        mutateProducts(currentProducts => 
            currentProducts?.map(p => 
                p.id === productToUpdate.id ? updatedProductData : p
            ), false
        );
        toast({ title: "Image Updated", description: `The image for ${productToUpdate.name} has been changed.` });
    } catch (error) {
        console.error("Failed to update image", error);
        toast({ title: "Update Failed", description: "Could not save the new image.", variant: "destructive" });
    } finally {
        setUpdatingProductId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
  };
  
  const handleResetImage = async (productToUpdate: Product) => {
    if (updatingProductId) return;
    setUpdatingProductId(productToUpdate.id);
    const otherImages = productToUpdate.images.slice(1);
    const updatedImages = ['https://placehold.co/400x400.png', ...otherImages];

    const updatedProductData: Product = {
      ...productToUpdate,
      images: updatedImages,
      imageUpdatedAt: new Date().toISOString(),
    };

    try {
        await updateProduct(updatedProductData);
        mutateProducts(currentProducts => 
            currentProducts?.map(p => 
                p.id === productToUpdate.id ? updatedProductData : p
            ), false
        );
        toast({ title: "Image Reset", description: `Image for ${productToUpdate.name} reset to default.` });
    } catch (error) {
        console.error("Failed to reset image", error);
        toast({ title: "Reset Failed", description: "Could not reset the image.", variant: "destructive" });
    } finally {
        setUpdatingProductId(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && updatingProductId) {
      const productToUpdate = products?.find(p => p.id === updatingProductId);
      if (!productToUpdate) {
        setUpdatingProductId(null);
        return;
      }

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = e.target?.result as string;
        handleUpdateImage(productToUpdate, newImage);
      };
      reader.readAsDataURL(file);
    } else {
        setUpdatingProductId(null);
    }
  };
  
  if (isLoading) {
    return (
        <div className="container py-12">
            <Progress value={progress} className="w-full mb-8" />
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        </div>
    )
  }
  
  if (!user || !['developer', 'shop-owner', 'imager'].includes(user.role)) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            Image Lab
        </h1>
        <Input 
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Input 
        id="file-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange} 
        ref={fileInputRef} 
        disabled={!!updatingProductId}
      />
      
      <Accordion type="multiple" defaultValue={Object.keys(productsByCategory).slice(0, 1)} className="w-full space-y-4">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
              return (
              <AccordionItem value={category} key={category} className="border-b-0">
                  <Card>
                      <AccordionTrigger className="p-4 hover:no-underline">
                          <h2 className="text-xl font-bold">{category}</h2>
                      </AccordionTrigger>
                      <AccordionContent>
                          <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {categoryProducts.map(p => (
                                  <Card key={p.id}>
                                      <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                                          <div className="col-span-2 space-y-2">
                                              <p className="font-semibold leading-tight">{p.name}</p>
                                              <p className="text-sm text-muted-foreground">{p.itemCode}</p>
                                              <TooltipProvider>
                                                  <Tooltip>
                                                      <TooltipTrigger asChild>
                                                          <Button
                                                              variant="ghost"
                                                              size="icon"
                                                              className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
                                                              onClick={() => handleResetImage(p)}
                                                              disabled={!!updatingProductId && updatingProductId !== p.id}
                                                          >
                                                              <Trash2 className="h-4 w-4"/>
                                                          </Button>
                                                      </TooltipTrigger>
                                                      <TooltipContent>
                                                          <p>Reset to default image</p>
                                                      </TooltipContent>
                                                  </Tooltip>
                                              </TooltipProvider>
                                          </div>
                                          <div className="col-span-1">
                                              <div 
                                                  className="w-full aspect-square rounded-md relative overflow-hidden border cursor-pointer group"
                                                  onClick={() => handleImageClick(p)}
                                              >
                                                  <Image 
                                                      src={p.images[0] || 'https://placehold.co/400x400.png'}
                                                      alt={p.name}
                                                      fill
                                                      className="object-cover transition-transform group-hover:scale-105"
                                                      data-ai-hint={p.dataAiHint}
                                                  />
                                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                      {updatingProductId === p.id ? (
                                                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                                                      ) : (
                                                          <Upload className="h-8 w-8 text-white" />
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      </CardContent>
                                  </Card>
                              ))}
                          </div>
                      </AccordionContent>
                  </Card>
              </AccordionItem>
          )})}
      </Accordion>
    </div>
  );
}
