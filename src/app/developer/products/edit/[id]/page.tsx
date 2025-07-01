
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams, notFound } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getProductById, getProducts, updateProduct } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Product } from "@/types";
import { Camera, FileImage, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  itemCode: z.string().min(1, { message: "Item code is required." }),
  batchNo: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  retailPrice: z.coerce.number().min(0.01, { message: "Retail price must be positive." }),
  wholesalePrice: z.coerce.number().min(0.01, { message: "Wholesale price must be positive." }),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
  isRecommended: z.boolean().optional(),
});

export default function EditItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [images, setImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isRecommended: false,
    }
  });

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
            const [foundProduct, allProducts] = await Promise.all([
                getProductById(productId),
                getProducts()
            ]);

            if (foundProduct) {
                setProduct(foundProduct);
                form.reset({
                  ...foundProduct,
                  isRecommended: foundProduct.isRecommended || false,
                });
                setImages(foundProduct.images);
                setCategories([...new Set(allProducts.map(p => p.category))].sort());
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

  }, [user, router, toast, params.id, form]);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!showCamera) {
         if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
         }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    getCameraPermission();
    
    return () => {
       if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  }, [showCamera, toast]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    if (!product) return;
    const imageChanged = JSON.stringify(images) !== JSON.stringify(product.images);
    const updatedProductData: Product = {
      ...product,
      ...data,
      isRecommended: data.isRecommended || false,
      images: images.length > 0 ? images : ['https://placehold.co/600x400.png'],
      imageUpdatedAt: imageChanged ? new Date().toISOString() : product.imageUpdatedAt,
    };
    await updateProduct(updatedProductData);
    toast({
      title: "Product Updated",
      description: `${data.name} has been updated.`,
    });
    router.push('/developer/products');
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = e.target?.result as string;
        setImages(prev => [...prev, newImage]);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && hasCameraPermission) {
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const newImage = canvas.toDataURL('image/png');
        setImages(prev => [...prev, newImage]);
        setShowCamera(false);
      }
    }
  };

  const handleSetPrimary = (indexToMakePrimary: number) => {
    if (indexToMakePrimary === 0) return;
    const newPrimaryImage = images[indexToMakePrimary];
    const otherImages = images.filter((_, index) => index !== indexToMakePrimary);
    setImages([newPrimaryImage, ...otherImages]);
  }

  const handleDeleteImage = (indexToDelete: number) => {
    if (images.length === 1) {
        toast({title: "Cannot delete the last image.", variant: "destructive"});
        return;
    }
    setImages(images.filter((_, index) => index !== indexToDelete));
  }


  if (loading) {
    return (
        <div className="container py-12">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
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
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Edit Product</CardTitle>
                        <CardDescription>Update the details for &quot;{product.name}&quot;.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        <FormItem>
                            <FormLabel>Product Images</FormLabel>
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((src, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <Image src={src} alt={`Product image ${index + 1}`} fill className="object-cover rounded-md border" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-1 p-1">
                                           {index > 0 && <Button type="button" size="sm" className="w-full text-xs" onClick={() => handleSetPrimary(index)}><Star className="h-3 w-3 mr-1"/>Primary</Button>}
                                           <Button type="button" size="sm" variant="destructive" className="w-full text-xs" onClick={() => handleDeleteImage(index)}><Trash2 className="h-3 w-3 mr-1"/>Delete</Button>
                                        </div>
                                         {index === 0 && <Badge className="absolute top-1 left-1">Primary</Badge>}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 mt-4">
                                {showCamera ? (
                                    <div className="space-y-2">
                                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {hasCameraPermission === false && (
                                            <Alert variant="destructive">
                                                <AlertTitle>Camera Access Required</AlertTitle>
                                                <AlertDescription>Please allow camera access to use this feature.</AlertDescription>
                                            </Alert>
                                        )}
                                        <div className="flex gap-2">
                                            <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">Capture Photo</Button>
                                            <Button type="button" variant="outline" onClick={() => setShowCamera(false)} className="w-full">Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 sm:gap-4">
                                        <Button asChild variant="outline" className="w-full">
                                            <Label htmlFor="file-upload" className="cursor-pointer flex items-center"><FileImage className="h-4 w-4 mr-2" /> Upload</Label>
                                        </Button>
                                        <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                                        <Button type="button" onClick={() => setShowCamera(true)} variant="outline" className="w-full"><Camera className="h-4 w-4 mr-2" /> Camera</Button>
                                    </div>
                                )}
                            </div>
                        </FormItem>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="itemCode" render={({ field }) => (
                                <FormItem><FormLabel>Item Code</FormLabel><FormControl><Input placeholder="e.g., FR-APL-001" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                        <FormField control={form.control} name="batchNo" render={({ field }) => (
                            <FormItem><FormLabel>Batch No. (Optional)</FormLabel><FormControl><Input placeholder="e.g., B20231101" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>

                        <FormField
                            control={form.control}
                            name="isRecommended"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Recommend Product
                                    </FormLabel>
                                    <FormDescription>
                                        Feature this product on the homepage in the &quot;Recommended&quot; section.
                                    </FormDescription>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem><FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} >
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="retailPrice" render={({ field }) => (
                                <FormItem><FormLabel>Retail Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                                <FormItem><FormLabel>Wholesale Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
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
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2">
                          <Button type="submit">Save Changes</Button>
                          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                      </div>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    </div>
  );
}
