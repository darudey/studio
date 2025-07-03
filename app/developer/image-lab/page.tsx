
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts, updateProduct, getCategories, updateCategoryImage, getAllCategoriesData } from "@/lib/data";
import type { Product, Category } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Upload, Loader2, Trash2, LayoutGrid, Umbrella, Headphones, Gem, Lamp, Package, Popcorn } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ChowminIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M60 46 H4 C2.89543 46 2 46.8954 2 48 V52 C2 53.1046 2.89543 54 4 54 H60 C61.1046 54 62 53.1046 62 52 V48 C62 46.8954 61.1046 46 60 46 Z" />
      <path d="M12 45 C 8 38, 16 34, 20 38" />
      <path d="M24 45 C 20 38, 28 34, 32 38" />
      <path d="M36 45 C 32 38, 40 34, 44 38" />
      <path d="M48 45 C 44 38, 52 34, 56 38" />
      <path d="M18 41 C 14 34, 22 30, 26 34" />
      <path d="M30 41 C 26 34, 34 30, 38 34" />
      <path d="M42 41 C 38 34, 46 30, 50 34" />
      <path d="M25 36 L30 42" strokeWidth="2" />
      <path d="M40 36 L45 42" strokeWidth="2" />
    </svg>
  );

const categoryIcons: { [key: string]: React.ElementType } = {
  'all': LayoutGrid,
  'monsoon': Umbrella,
  'electronics': Headphones,
  'beauty': Gem,
  'decor': Lamp,
  'fashion': Popcorn,
  'chowmin': ChowminIcon,
  'cosmetics': Gem,
  'general': Package,
  'puja items': Package,
};

const getIconForCategory = (category: string): React.ElementType => {
    const lowerCategory = category.toLowerCase();
    if (categoryIcons[lowerCategory]) {
        return categoryIcons[lowerCategory];
    }
    for (const key in categoryIcons) {
        if (lowerCategory.includes(key)) {
            return categoryIcons[key];
        }
    }
    return Package;
};


export default function ManageProductImagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryData, setCategoryData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [updatingCategoryName, setUpdatingCategoryName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryFileInputRef = useRef<HTMLInputElement>(null);

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
    Promise.all([
        getProducts(),
        getCategories(),
        getAllCategoriesData()
    ]).then(([productsData, categoriesData, allCategoryObjects]) => {
      setProducts(productsData);
      setCategories(categoriesData);
      setCategoryData(allCategoryObjects);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to load page data", err);
        toast({ title: "Error", description: "Failed to load products and categories.", variant: "destructive" });
        setLoading(false);
    });
  }, [user, router, toast]);
  
  const productsByCategory = useMemo(() => {
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
    if (updatingProductId || updatingCategoryName) return;
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
  
  const handleResetImage = async (productToUpdate: Product) => {
    if (updatingProductId || updatingCategoryName) return;
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
        setProducts(currentProducts => 
            currentProducts.map(p => 
                p.id === productToUpdate.id ? updatedProductData : p
            )
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
        setUpdatingProductId(null);
    }
  };
  
  const handleCategoryUploadClick = (categoryName: string) => {
    if (updatingCategoryName || updatingProductId) return;
    setUpdatingCategoryName(categoryName);
    categoryFileInputRef.current?.click();
  };

  const handleCategoryFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryName = updatingCategoryName;
    if (event.target.files && event.target.files[0] && categoryName) {
      setUpdatingCategoryName(categoryName); // Keep showing loader
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = async (e) => {
        const newImage = e.target?.result as string;
        try {
            const updatedCategory = await updateCategoryImage(categoryName, newImage);
            
            setCategoryData(currentData => {
                const existingIndex = currentData.findIndex(c => c.name === categoryName);
                if (existingIndex > -1) {
                    const newData = [...currentData];
                    newData[existingIndex] = updatedCategory;
                    return newData;
                }
                return [...currentData, updatedCategory];
            });

          toast({
            title: "Category Image Updated",
            description: `The image for ${categoryName} has been updated.`,
          });
        } catch (error) {
          console.error("Failed to update category image", error);
          toast({
            title: "Update Failed",
            description: "Could not save the new category image.",
            variant: "destructive",
          });
        } finally {
          setUpdatingCategoryName(null);
          if (categoryFileInputRef.current) {
            categoryFileInputRef.current.value = "";
          }
        }
      };
      
      reader.onerror = () => {
        setUpdatingCategoryName(null);
        toast({ title: "Import Failed", description: "Error reading the file.", variant: "destructive" });
      }
      
      reader.readAsDataURL(file);
    } else {
        setUpdatingCategoryName(null);
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
      
      <Input 
        id="file-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileChange} 
        ref={fileInputRef} 
        disabled={!!updatingProductId}
      />
      <Input 
        id="category-file-upload" 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleCategoryFileChange} 
        ref={categoryFileInputRef} 
        disabled={!!updatingCategoryName}
      />


      {loading ? (
        <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={Object.keys(productsByCategory).slice(0, 1)} className="w-full space-y-4">
            {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
                const categoryImageObject = categoryData.find(c => c.name === category);
                const categoryImageUrl = categoryImageObject?.imageUrl;
                const DefaultIcon = getIconForCategory(category);
                
                return (
                <AccordionItem value={category} key={category} className="border-b-0">
                    <Card>
                        <AccordionTrigger className="p-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full">
                                <h2 className="text-xl font-bold">{category}</h2>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                role="button"
                                                className={cn(
                                                    "flex items-center justify-center rounded-md transition-all",
                                                    categoryImageUrl
                                                        ? "w-10 h-10 relative group/img border" 
                                                        : "bg-accent text-accent-foreground hover:bg-accent/90 w-10 h-10"
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCategoryUploadClick(category);
                                                }}
                                            >
                                                {updatingCategoryName === category ? (
                                                    <Loader2 className="h-5 w-5 animate-spin"/>
                                                ) : (
                                                    <>
                                                        {categoryImageUrl ? (
                                                            <>
                                                                <Image src={categoryImageUrl} alt={category} fill className="object-cover rounded-md"/>
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                                                                    <Upload className="h-5 w-5 text-white"/>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <DefaultIcon className="h-5 w-5"/>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{categoryImageUrl ? 'Change' : 'Upload'} category image</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
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
      )}
    </div>
  );
}
