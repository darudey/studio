
"use client";

import { useEffect, useState, useRef } from "react";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Product } from "@/types";
import { Camera, FileImage, X } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  retailPrice: z.coerce.number().min(0.01, { message: "Retail price must be positive." }),
  wholesalePrice: z.coerce.number().min(0.01, { message: "Wholesale price must be positive." }),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
});

export default function AddItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState(() => [...new Set(products.map(p => p.category))].sort());
  const [newCategory, setNewCategory] = useState("");
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== 'developer') {
      toast({ title: "Access Denied", description: "This page is for developers only.", variant: "destructive" });
      router.push("/");
    }
  }, [user, router, toast]);

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
      images: [imageSrc || 'https://placehold.co/600x400.png'],
    };
    addProduct(newProduct);
    toast({
      title: "Product Added",
      description: `${data.name} has been added to the catalog.`,
    });
    form.reset();
    setImageSrc(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !categories.includes(trimmedCategory)) {
      setCategories([...categories, trimmedCategory].sort());
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setCategories(categories.filter(c => c !== categoryToDelete));
    if (form.getValues("category") === categoryToDelete) {
      form.setValue("category", "");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
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
        setImageSrc(canvas.toDataURL('image/png'));
        setShowCamera(false);
      }
    }
  };

  if (!user || user.role !== 'developer') {
    return <div className="container text-center py-10">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Categories</CardTitle>
                        <CardDescription>Add or remove product categories.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <div key={cat} className="flex items-center justify-between rounded-md border p-2">
                                    <span className="text-sm">{cat}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCategory(cat)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2">
                        <Label htmlFor="new-category">Add New Category</Label>
                        <div className="flex w-full space-x-2">
                            <Input id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g., Vegetables"/>
                            <Button onClick={handleAddCategory}>Add</Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Product</CardTitle>
                        <CardDescription>Fill in the details to add a new item.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormItem>
                                    <FormLabel>Product Image</FormLabel>
                                    <div className="space-y-4">
                                        {imageSrc && (
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                                <Image src={imageSrc} alt="Product preview" fill className="object-cover" />
                                            </div>
                                        )}
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
                                                    <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full">Capture Photo</Button>
                                                    <Button variant="outline" onClick={() => setShowCamera(false)} className="w-full">Cancel</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 sm:gap-4">
                                                <Button asChild variant="outline" className="w-full">
                                                    <Label htmlFor="file-upload" className="cursor-pointer flex items-center"><FileImage className="h-4 w-4 mr-2" /> Upload</Label>
                                                </Button>
                                                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                                                <Button onClick={() => setShowCamera(true)} variant="outline" className="w-full"><Camera className="h-4 w-4 mr-2" /> Camera</Button>
                                            </div>
                                        )}
                                    </div>
                                </FormItem>
                                
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the product" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
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
        </div>
    </div>
  );
}
