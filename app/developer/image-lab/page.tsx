
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts, updateProduct } from "@/lib/data";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Upload, Loader2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ManageProductImagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State to track which product is being updated
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }

    setLoading(true);
    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to load products", err);
        toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
        setLoading(false);
    });
  }, [user, router, toast]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleImageClick = (product: Product) => {
    // Prevent multiple uploads at once
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
        
        setProducts(currentProducts => 
            currentProducts.map(p => 
                p.id === productToUpdate.id ? updatedProductData : p
            )
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && updatingProductId) {
      const productToUpdate = products.find(p => p.id === updatingProductId);
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
        // If no file is selected, or if the process was cancelled.
        setUpdatingProductId(null);
    }
  };
  
  const ProductImageSkeleton = () => (
      <Card>
          <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
              <div className="col-span-1">
                  <Skeleton className="w-full aspect-square rounded-md" />
              </div>
          </CardContent>
      </Card>
  )

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
      
      {/* Hidden file input */}
      <Input 
        id="file-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange} 
        ref={fileInputRef} 
        disabled={!!updatingProductId}
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ProductImageSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <Card key={p.id}>
                <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                        <p className="font-semibold leading-tight">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.itemCode}</p>
                         <p className="text-xs text-muted-foreground mt-4">Click image to upload.</p>
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
      )}
    </div>
  );
}
