
"use client";

import { useEffect, useState, useMemo, useRef, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProducts, deleteProduct as removeProduct, updateProductsCategory, addProduct, deleteMultipleProducts, updateProduct } from "@/lib/data";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, PlusCircle, Upload, X, ListTree } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const addProductSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.string().min(1, "Category is required"),
  retailPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  unit: z.enum(['kg', 'g', 'litre', 'ml', 'piece', 'dozen']),
  itemCode: z.string().optional(),
  description: z.string().optional(),
});


export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [bulkUpdateCategory, setBulkUpdateCategory] = useState("");
  
  const [isAdding, setIsAdding] = useState(false);

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        const derivedCategories = [...new Set(fetchedProducts.map(p => p.category))].sort();
        setAllCategories(derivedCategories);
    } catch(error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    } 
    if (!['developer', 'shop-owner'].includes(user.role)) {
      toast({ title: "Access Denied", description: "This page is for administrators only.", variant: "destructive" });
      router.push("/");
      return;
    }
    
    fetchProductsAndCategories();
  }, [user, router, toast]);

  const addForm = useForm<z.infer<typeof addProductSchema>>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: "",
      category: "",
      retailPrice: 0,
      wholesalePrice: 0,
      stock: 0,
      unit: "piece",
      itemCode: "",
      description: "",
    },
  });
  
  const handleFieldUpdate = async (productId: string, updates: Partial<Product>) => {
    const productToUpdate = products.find(p => p.id === productId);
    if (!productToUpdate) return;

    const hasChanged = Object.keys(updates).some(key => {
        const typedKey = key as keyof Product;
        // Stringify to compare arrays correctly
        return JSON.stringify(productToUpdate[typedKey]) !== JSON.stringify(updates[typedKey]);
    });
    if (!hasChanged) return;
    
    const updatedProductData = { 
        ...productToUpdate, 
        ...updates,
        ...(updates.images && { imageUpdatedAt: new Date().toISOString() })
    };

    await updateProduct(updatedProductData);
    
    setProducts(currentProducts => 
        currentProducts.map(p => p.id === productId ? updatedProductData : p)
    );

    const updatedFields = Object.keys(updates).join(', ');
    toast({ title: "Product Updated", description: `${productToUpdate.name}'s ${updatedFields} has been updated.` });
};

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>, product: Product) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const newImageSrc = e.target?.result as string;
          const updatedImages = [newImageSrc, ...product.images.slice(1)];
          handleFieldUpdate(product.id, { images: updatedImages });
      };
      reader.readAsDataURL(file);
      event.target.value = ""; 
  };


  const onQuickAddSubmit = async (data: z.infer<typeof addProductSchema>) => {
    const now = new Date().toISOString();
    const newProductData: Omit<Product, 'id'> = {
      name: data.name,
      category: data.category,
      retailPrice: data.retailPrice,
      wholesalePrice: data.wholesalePrice,
      stock: data.stock,
      unit: data.unit,
      itemCode: data.itemCode || `QA-${Date.now()}`,
      description: data.description || "No description provided.",
      images: ['https://placehold.co/600x400.png'],
      batchNo: 'N/A',
      imageUpdatedAt: now,
      isRecommended: false,
      createdAt: now,
      dataAiHint: data.name.toLowerCase().split(' ').slice(0, 2).join(' ')
    };
    
    await addProduct(newProductData);
    toast({ title: "Product Added", description: `${data.name} has been added.` });
    addForm.reset();
    setIsAdding(false);
    fetchProductsAndCategories();
  };


  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    
    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\s\W\d_]/gi, '');
    const consonantFilter = getConsonants(searchTerm);

    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedFilter);
      const categoryMatch = product.category.toLowerCase().includes(lowercasedFilter);

      if (nameMatch || itemCodeMatch || categoryMatch) {
        return true;
      }
      
      if (consonantFilter.length > 1) {
        const nameConsonants = getConsonants(product.name);
        if (nameConsonants.includes(consonantFilter)) {
            return true;
        }
      }

      return false;
    });
  }, [products, searchTerm]);


  const handleSelectOne = (productId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProductIds(prev => [...prev, productId]);
    } else {
      setSelectedProductIds(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedProductIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory && !allCategories.includes(trimmedCategory)) {
      const newCats = [...allCategories, trimmedCategory].sort()
      setAllCategories(newCats);
      setNewCategory("");
      if (!addForm.getValues("category")) {
          addForm.setValue("category", trimmedCategory);
      }
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setAllCategories(allCategories.filter(c => c !== categoryToDelete));
  };
  
  const handleBulkUpdate = async () => {
    if (!bulkUpdateCategory.trim()) {
      toast({ title: "Please enter a category name", variant: "destructive" });
      return;
    }
    if (selectedProductIds.length === 0) {
      toast({ title: "No products selected", variant: "destructive" });
      return;
    }
    
    const categoryToUpdate = bulkUpdateCategory.trim();

    await updateProductsCategory(selectedProductIds, categoryToUpdate);
    await fetchProductsAndCategories();
    setSelectedProductIds([]);
    setBulkUpdateCategory("");
    toast({ title: "Bulk Update Successful", description: `${selectedProductIds.length} products moved to "${categoryToUpdate}".`});
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.length === 0) return;
    await deleteMultipleProducts(selectedProductIds);
    toast({ title: "Products Deleted", description: `${selectedProductIds.length} products have been removed.` });
    fetchProductsAndCategories();
    setSelectedProductIds([]);
  }

  const handleDeleteProduct = async (productId: string) => {
    await removeProduct(productId);
    setProducts(products.filter(p => p.id !== productId)); 
    toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
  };
  
  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;

  if (loading) {
      return (
          <div className="container py-12">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                          <Skeleton className="h-8 w-48" />
                          <Skeleton className="h-4 w-72 mt-2" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-2">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container py-12">
        <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle>Manage Products</CardTitle>
                    <CardDescription>View, search, and manage your products.</CardDescription>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                <Input 
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-auto"
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="hidden sm:flex">
                            <ListTree className="mr-2 h-4 w-4" />
                            Categories
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Manage Categories</DialogTitle>
                            <DialogDescription>Add or remove product categories from your store.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {allCategories.map(cat => (
                                    <div key={cat} className="flex items-center justify-between rounded-md border p-2">
                                        <span className="text-sm">{cat}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCategory(cat)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                {allCategories.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No categories created yet.</p>
                                )}
                            </div>
                            <div className="pt-4 border-t">
                                <Label htmlFor="new-category" className="mb-2 block font-medium">Add New Category</Label>
                                <div className="flex w-full space-x-2">
                                    <Input id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g., Vegetables"/>
                                    <Button onClick={handleAddCategory}>Add</Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <Button onClick={() => setIsAdding(!isAdding)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {isAdding ? 'Cancel' : 'Add'}
                </Button>
                </div>
            </div>
        </CardHeader>

        {isAdding && (
            <CardContent>
                <Form {...addForm}>
                    <form onSubmit={addForm.handleSubmit(onQuickAddSubmit)} className="p-4 border rounded-lg bg-muted/50 space-y-4">
                            <h3 className="text-lg font-semibold">Add a New Product</h3>
                            <FormField control={addForm.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Product Name</FormLabel><FormControl><Input placeholder="e.g., Organic Apples" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={addForm.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Select or create a category" {...field} list="add-categories-list" />
                                    </FormControl>
                                    <datalist id="add-categories-list">
                                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={addForm.control} name="itemCode" render={({ field }) => (
                                <FormItem><FormLabel>Item Code (Optional)</FormLabel><FormControl><Input placeholder="e.g., FR-APL-001" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <FormField control={addForm.control} name="retailPrice" render={({ field }) => (
                                <FormItem><FormLabel>Retail (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addForm.control} name="wholesalePrice" render={({ field }) => (
                                <FormItem><FormLabel>Wholesale (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addForm.control} name="stock" render={({ field }) => (
                                <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={addForm.control} name="unit" render={({ field }) => (
                                <FormItem><FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="piece">Piece</SelectItem><SelectItem value="kg">Kg</SelectItem><SelectItem value="g">Gram</SelectItem><SelectItem value="litre">Litre</SelectItem><SelectItem value="ml">ml</SelectItem><SelectItem value="dozen">Dozen</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            </div>
                            <FormField control={addForm.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Product description" {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                        <div className="flex gap-2">
                            <Button type="submit">Save Product</Button>
                            <Button variant="outline" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        )}

        <CardContent>
            {selectedProductIds.length > 0 && (
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 p-4 mb-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium">{selectedProductIds.length} selected</p>
                <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-xs">
                    <Input
                        placeholder="Enter category to move..."
                        value={bulkUpdateCategory}
                        onChange={(e) => setBulkUpdateCategory(e.target.value)}
                        list="bulk-categories-list"
                        className="w-full"
                    />
                    <datalist id="bulk-categories-list">
                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <Button onClick={handleBulkUpdate} size="sm">Apply</Button>
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">Delete Selected</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedProductIds.length} selected products.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive hover:bg-destructive/90">Delete Products</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            )}
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[20px] p-2"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Retail (₹)</TableHead>
                    <TableHead>Wholesale (₹)</TableHead>
                    <TableHead>Stock / Unit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => (
                <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) ? "selected" : ""}>
                    <TableCell className="p-2"><Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}/></TableCell>
                    <TableCell>
                        <label htmlFor={`image-upload-${product.id}`} className="cursor-pointer relative group block w-16 h-16">
                            <Image src={product.images[0]} alt={product.name} width={64} height={64} className="rounded-md object-cover w-16 h-16"/>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Upload className="h-6 w-6 text-white" />
                            </div>
                        </label>
                        <input 
                            id={`image-upload-${product.id}`} 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, product)} 
                        />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}<br/><span className="text-xs text-muted-foreground">{product.itemCode}</span></TableCell>
                    <TableCell>
                        <Select value={product.category} onValueChange={(newCategory) => handleFieldUpdate(product.id, { category: newCategory })}>
                            <SelectTrigger className="h-9 w-[150px]">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                            <Input
                                type="number"
                                defaultValue={product.retailPrice}
                                onBlur={(e) => handleFieldUpdate(product.id, { retailPrice: parseFloat(e.target.value) || 0 })}
                                className="h-9 pl-5 w-[100px]"
                            />
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                            <Input
                                type="number"
                                defaultValue={product.wholesalePrice}
                                onBlur={(e) => handleFieldUpdate(product.id, { wholesalePrice: parseFloat(e.target.value) || 0 })}
                                className="h-9 pl-5 w-[100px]"
                            />
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                defaultValue={product.stock}
                                onBlur={(e) => handleFieldUpdate(product.id, { stock: parseInt(e.target.value, 10) || 0 })}
                                className="h-9 w-20"
                            />
                            <Select value={product.unit} onValueChange={(newUnit: Product['unit']) => handleFieldUpdate(product.id, { unit: newUnit })}>
                                <SelectTrigger className="h-9 w-[90px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="kg">kg</SelectItem>
                                    <SelectItem value="g">g</SelectItem>
                                    <SelectItem value="litre">litre</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="piece">piece</SelectItem>
                                    <SelectItem value="dozen">dozen</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon"><Link href={`/developer/products/edit/${product.id}`}><Edit className="h-4 w-4" /><span className="sr-only">Edit Full Details</span></Link></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the product &quot;{product.name}&quot;.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        </Card>
    </div>
  );
}

    