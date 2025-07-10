
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { addProduct, getProducts, addMultipleProducts, getCategories } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types";
import { Upload, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ProductForm from "@/components/app/ProductForm";

export default function AddItemPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const bulkImportInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

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
        
        getCategories().then(fetchedCategories => {
            setCategories(fetchedCategories);
            setLoading(false);
        });
    }, [user, router, toast]);

    const handleFormSubmit = async (data: any, images: string[]) => {
        setIsSubmitting(true);
        const newProductData: Omit<Product, 'id'> = {
            ...data,
            wholesalePrices: data.wholesalePrices || [],
            batchNo: data.batchNo || 'N/A',
            images: images,
            imageUpdatedAt: new Date().toISOString(),
            isRecommended: false,
            createdAt: new Date().toISOString(),
            dataAiHint: data.name.toLowerCase().split(' ').slice(0, 2).join(' ')
        };
        try {
            await addProduct(newProductData);
            toast({
                title: "Product Added",
                description: `${data.name} has been added to the catalog.`,
            });
            router.push('/developer/products');
        } catch (error) {
            console.error("Failed to add product", error);
            toast({ title: "Error", description: "Failed to add product.", variant: "destructive" });
            setIsSubmitting(false);
        }
    };
    
    const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onerror = () => {
            toast({ title: "Import Failed", description: "The selected file could not be read.", variant: "destructive" });
            if (bulkImportInputRef.current) {
                bulkImportInputRef.current.value = "";
            }
        };
        
        reader.onload = async (e) => {
            setIsImporting(true);
            try {
                const data = e.target?.result;
                if (!data) throw new Error("Could not read file data.");
                
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json<any>(worksheet);

                const allProducts = await getProducts();
                const existingProductNames = new Set(allProducts.map(p => p.name.toLowerCase()));
                
                const importedProducts: Omit<Product, 'id'>[] = [];
                const newCategoriesSet = new Set<string>(categories);
                const now = new Date().toISOString();
                
                const skippedRows: { row: number, reason: string }[] = [];
                const validUnits = ['kg', 'g', 'litre', 'ml', 'piece', 'dozen'];

                json.forEach((row, index) => {
                    const rowNumber = index + 2;
                    if (!row.Name || typeof row.Name !== 'string' || !row.Name.trim()) {
                        skippedRows.push({ row: rowNumber, reason: "Missing Product Name" });
                        return;
                    }

                    const productName = (row.Name as string).trim();
                    if (existingProductNames.has(productName.toLowerCase())) {
                        skippedRows.push({ row: rowNumber, reason: `Product "${productName}" already exists.` });
                        return;
                    }

                    const mrp = parseFloat(row['MRP']);
                    const retailPrice = parseFloat(row['Retail Price']);
                    const wholesalePrice = parseFloat(row['Wholesale Price']);
                    const stock = parseInt(row['Stock Quantity'], 10);
                    const rowUnit = typeof row.Unit === 'string' ? row.Unit.toLowerCase().trim() : 'piece';
                    const unit = validUnits.includes(rowUnit) ? rowUnit : 'piece';

                    const newProductData: Omit<Product, 'id'> = {
                        name: productName,
                        itemCode: row['Item Code']?.toString() || `IMP-${Date.now()}-${index}`,
                        batchNo: row['Batch No.']?.toString() || 'N/A',
                        description: row.description || 'No description provided.',
                        images: row.image ? [row.image] : [],
                        imageUpdatedAt: now,
                        category: row.category || 'Uncategorized',
                        mrp: !isNaN(mrp) ? mrp : (!isNaN(retailPrice) ? retailPrice : 0),
                        retailPrice: !isNaN(retailPrice) ? retailPrice : 0,
                        wholesalePrices: [{ unit: 'piece', price: !isNaN(wholesalePrice) ? wholesalePrice : 0 }],
                        unit: unit as Product['unit'],
                        stock: !isNaN(stock) ? stock : 0,
                        dataAiHint: productName.toLowerCase().split(' ').slice(0, 2).join(' '),
                        isRecommended: false,
                        createdAt: now,
                        updatedAt: now,
                    };
                    
                    importedProducts.push(newProductData);
                    existingProductNames.add(productName.toLowerCase());
                    if (newProductData.category) newCategoriesSet.add(newProductData.category);
                });
                
                if (importedProducts.length > 0) await addMultipleProducts(importedProducts);

                setCategories(Array.from(newCategoriesSet).sort());
                
                let description = `${importedProducts.length} product${importedProducts.length !== 1 ? 's' : ''} have been imported.`;
                if (skippedRows.length > 0) {
                    const duplicateCount = skippedRows.filter(r => r.reason.includes("already exists")).length;
                    const missingNameCount = skippedRows.length - duplicateCount;
                    let skippedMessages: string[] = [];
                    if (duplicateCount > 0) skippedMessages.push(`${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''}`);
                    if (missingNameCount > 0) skippedMessages.push(`${missingNameCount} with missing name${missingNameCount > 1 ? 's' : ''}`);
                    description += ` ${skippedRows.length} rows were skipped (${skippedMessages.join(" & ")}).`;
                }
                
                toast({ title: "Import Complete", description });
            } catch (error) {
                console.error("Bulk import failed:", error);
                toast({ title: "Import Failed", description: "An unexpected error occurred during processing.", variant: "destructive" });
            } finally {
                setIsImporting(false);
                if (bulkImportInputRef.current) bulkImportInputRef.current.value = "";
            }
        };

        reader.readAsArrayBuffer(file);
    };

    if (loading || !user || !['developer', 'shop-owner', 'imager'].includes(user.role)) {
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
                                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4 text-blue-600" />}
                                {isImporting ? 'Importing...' : 'Upload File'}
                            </Label>
                            <Input 
                                id="bulk-import" 
                                ref={bulkImportInputRef}
                                type="file" 
                                className="hidden" 
                                accept=".xlsx, .xls, .csv"
                                onChange={handleBulkImport}
                                disabled={isImporting}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Required: Name. All other fields are optional.
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
                            <ProductForm 
                                categories={categories}
                                onFormSubmit={handleFormSubmit}
                                isSubmitting={isSubmitting}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
