
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
import { addProduct, getProducts, addMultipleProducts } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Product } from "@/types";
import { Camera, FileImage, Upload, X } from "lucide-react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";


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
});

export default function AddItemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState<string[]>([]);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!['developer', 'shop-owner'].includes(user.role)) {
      toast({ title: "Access Denied", description: "This page is for administrators only.", variant: "destructive" });
      router.push("/");
    } else {
        getProducts().then(products => {
            const fetchedCategories = [...new Set(products.map(p => p.category))].sort();
            setCategories(fetchedCategories);
        })
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
      itemCode: "",
      batchNo: "",
      description: "",
      category: "",
      retailPrice: 0,
      wholesalePrice: 0,
      unit: "piece",
      stock: 0,
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (data) => {
    const newProductData: Omit<Product, 'id'> = {
      ...data,
      batchNo: data.batchNo || 'N/A',
      images: [imageSrc || 'https://placehold.co/600x400.png'],
      imageUpdatedAt: new Date().toISOString(),
      isRecommended: false,
      createdAt: new Date().toISOString(),
      dataAiHint: data.name.toLowerCase().split(' ').slice(0, 2).join(' ')
    };
    await addProduct(newProductData);
    toast({
      title: "Product Added",
      description: `${data.name} has been added to the catalog.`,
    });
    form.reset();
    setImageSrc(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    // Re-fetch categories in case a new one was added
    getProducts().then(products => {
        const fetchedCategories = [...new Set(products.map(p => p.category))].sort();
        setCategories(fetchedCategories);
    });
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

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        if (!data) {
             toast({ title: "Import Failed", description: "Could not read the file.", variant: "destructive" });
             setIsImporting(false);
             return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);
        
        const importedProducts: Omit<Product, 'id'>[] = [];
        const newCategoriesSet = new Set<string>(categories);
        const now = new Date().toISOString();
        
        const skippedRows: { row: number, reason: string }[] = [];
        const validUnits = ['kg', 'g', 'litre', 'ml', 'piece', 'dozen'];

        json.forEach((row, index) => {
            const rowNumber = index + 2;
            // A name is the only hard requirement.
            if (!row.Name || typeof row.Name !== 'string' || !row.Name.trim()) {
                skippedRows.push({ row: rowNumber, reason: "Missing Product Name" });
                return;
            }

            // Provide safe fallbacks for prices if they are empty or invalid
            const retailPrice = parseFloat(row['Selling Price']);
            const wholesalePrice = parseFloat(row['Purchase Price']);
            const stock = parseInt(row['Stock Quantity'], 10);

            // Check if Unit is valid, otherwise default to 'piece'
            const rowUnit = typeof row.Unit === 'string' ? row.Unit.toLowerCase().trim() : 'piece';
            const unit = validUnits.includes(rowUnit) ? rowUnit : 'piece';

            const newProductData: Omit<Product, 'id'> = {
              name: row.Name,
              itemCode: row['Item Code']?.toString() || `IMP-${Date.now()}-${index}`,
              batchNo: row['Batch No.']?.toString() || 'N/A',
              description: row.description || 'No description provided.',
              images: [row.image || 'https://placehold.co/600x400.png'],
              imageUpdatedAt: now,
              category: row.category || 'Uncategorized',
              retailPrice: !isNaN(retailPrice) ? retailPrice : 0,
              wholesalePrice: !isNaN(wholesalePrice) ? wholesalePrice : 0,
              unit: unit as Product['unit'],
              stock: !isNaN(stock) ? stock : 0,
              dataAiHint: row.Name.toLowerCase().split(' ').slice(0, 2).join(' '),
              isRecommended: false,
              createdAt: now,
            };
            
            importedProducts.push(newProductData);
            if (newProductData.category) {
                newCategoriesSet.add(newProductData.category);
            }
        });
        
        if (importedProducts.length > 0) {
            await addMultipleProducts(importedProducts);
        }

        setCategories(Array.from(newCategoriesSet).sort());
        
        let description = `${importedProducts.length} products have been imported.`;
        if (skippedRows.length > 0) {
            description += ` ${skippedRows.length} rows were skipped due to missing product names.`;
        }
        
        toast({
          title: "Import Complete",
          description: description,
        });
      };
      reader.onerror = () => {
        toast({ title: "Import Failed", description: "Error reading the file.", variant: "destructive" });
      }
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Bulk import failed:", error);
      toast({ title: "Import Failed", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };


  if (!user || !['developer', 'shop-owner'].includes(user.role)) {
    return <div className="container text-center py-10">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Import Products</CardTitle>
                        <CardDescription>Upload an Excel (.xlsx) or CSV file to add multiple products at once.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="bulk-import" className={cn(buttonVariants({variant: 'outline'}), "w-full cursor-pointer flex items-center justify-center")}>
                            <Upload className="mr-2 h-4 w-4" />
                            {isImporting ? 'Importing...' : 'Upload File'}
                        </Label>
                        <Input 
                            id="bulk-import" 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx, .xls, .csv"
                            onChange={handleBulkImport}
                            disabled={isImporting}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Required: Name. All other fields like prices and stock are optional.
                        </p>
                    </CardContent>
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
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem><FormLabel>Category</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Fruits or Vegetables" {...field} list="categories-list" />
                                        </FormControl>
                                        <datalist id="categories-list">
                                            {categories.map(cat => <option key={cat} value={cat} />)}
                                        </datalist>
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
