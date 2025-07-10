
"use client";

import { useRef, useState, useEffect } from "react";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Product, WholesalePrice } from "@/types";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Camera, FileImage, Star, Trash2, Loader2, PlusCircle, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCategorySettings } from "@/context/CategorySettingsContext";
import { CategoryIconAsImage } from "@/lib/icons";
import { Separator } from "../ui/separator";

const wholesalePriceSchema = z.object({
  unit: z.string().min(1, "Unit is required."),
  price: z.coerce.number().min(0.01, "Price must be positive."),
  note: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, { message: "Product name must be at least 2 characters." }),
  itemCode: z.string().min(1, { message: "Item code is required." }),
  batchNo: z.string().optional(),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Category is required." }),
  mrp: z.coerce.number().min(0, "MRP must be a positive number.").optional(),
  retailPrice: z.coerce.number().min(0.01, { message: "Retail price must be positive." }),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  stock: z.coerce.number().int().min(0, { message: "Stock cannot be negative." }),
  isRecommended: z.boolean().optional(),
  wholesalePrices: z.array(wholesalePriceSchema).min(1, "At least one wholesale price is required."),
});

type ProductFormData = z.infer<typeof formSchema>;

interface ProductFormProps {
    product?: Product | null;
    categories: string[];
    onFormSubmit: (data: ProductFormData, images: string[]) => Promise<void>;
    isSubmitting: boolean;
}

const defaultValues = {
    name: "",
    itemCode: "",
    batchNo: "",
    description: "",
    category: "",
    mrp: 0,
    retailPrice: 0,
    unit: "piece" as const,
    stock: 0,
    isRecommended: false,
    wholesalePrices: [{ unit: "piece", price: 0, note: "" }],
};

export default function ProductForm({ product, categories, onFormSubmit, isSubmitting }: ProductFormProps) {
    const { toast } = useToast();
    const { settingsMap } = useCategorySettings();

    const [images, setImages] = useState<string[]>([]);
    const [showCamera, setShowCamera] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProductFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: product ? {
            ...product,
            mrp: product.mrp || product.retailPrice,
            isRecommended: product.isRecommended || false,
            wholesalePrices: product.wholesalePrices?.length > 0 ? product.wholesalePrices : [{ unit: 'piece', price: 0, note: '' }]
        } : defaultValues,
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "wholesalePrices"
    });

    useEffect(() => {
        if (product) {
            form.reset({
                ...product,
                mrp: product.mrp || product.retailPrice,
                isRecommended: product.isRecommended || false,
                wholesalePrices: product.wholesalePrices?.length > 0 ? product.wholesalePrices : [{ unit: 'piece', price: 0, note: '' }]
            });
            setImages(product.images.filter(img => !img.includes('placehold.co')));
        }
    }, [product, form]);

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

    const handleSubmit: SubmitHandler<ProductFormData> = async (data) => {
        await onFormSubmit(data, images);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const newImage = e.target?.result as string;
                setImages(prev => [...prev, newImage]);
                setShowCamera(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
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
        setImages(currentImages => {
            const newPrimaryImage = currentImages[indexToMakePrimary];
            const otherImages = currentImages.filter((_, index) => index !== indexToMakePrimary);
            return [newPrimaryImage, ...otherImages];
        });
    }

    const handleDeleteImage = (indexToDelete: number) => {
        setImages(images.filter((_, index) => index !== indexToDelete));
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                 <FormItem>
                    <FormLabel>Product Images</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.length === 0 && product && (
                            <div className="relative group aspect-square col-span-full border rounded-md">
                                <CategoryIconAsImage category={product.category} imageUrl={settingsMap[product.category]} />
                            </div>
                        )}
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
                                    <Label htmlFor="file-upload" className="cursor-pointer flex items-center"><FileImage className="h-4 w-4 mr-2 text-blue-600" /> Upload</Label>
                                </Button>
                                <Input id="file-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                                <Button type="button" onClick={() => setShowCamera(true)} variant="outline" className="w-full"><Camera className="h-4 w-4 mr-2 text-blue-600" /> Camera</Button>
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

                {product && (
                     <FormField control={form.control} name="isRecommended" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">Recommend Product</FormLabel>
                            <FormDescription>Feature this product on the homepage.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}/>
                )}
               
                <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <div className="relative">
                            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {categories.map(cat => (
                                    <Button
                                        key={cat}
                                        type="button"
                                        variant={field.value === cat ? "default" : "outline"}
                                        onClick={() => field.onChange(cat)}
                                        className="shrink-0 h-8"
                                    >
                                        {cat}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <FormControl>
                            <Input 
                                placeholder="Select a category above or type a new one" 
                                {...field} 
                            />
                        </FormControl>
                        <FormDescription>Select an existing category or type to create a new one.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField control={form.control} name="mrp" render={({ field }) => (
                        <FormItem><FormLabel>MRP (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="retailPrice" render={({ field }) => (
                        <FormItem><FormLabel>Retail Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem><FormLabel>Base / Retail Unit</FormLabel>
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

                <Separator />
                
                <div>
                  <FormLabel>Wholesale Pricing Tiers</FormLabel>
                  <FormDescription className="mb-4">Add different units and prices for wholesale customers.</FormDescription>
                  <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-3 border rounded-lg space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                            <FormField
                                control={form.control}
                                name={`wholesalePrices.${index}.unit`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Unit</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g., Dozen" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`wholesalePrices.${index}.price`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Price (₹)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="120" {...field} />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 mt-6" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <FormField
                            control={form.control}
                            name={`wholesalePrices.${index}.note`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">Note (Optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 1 dozen = 12 pieces" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ unit: "", price: 0, note: "" })}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4"/> Add Tier
                  </Button>
                  </div>
                </div>
                
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {product ? 'Save Changes' : 'Add Product'}
                </Button>
            </form>
        </Form>
    );
}
