
"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProducts, deleteProduct as removeProduct, updateProduct, updateProductsCategory } from "@/lib/data";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, PlusCircle, Save, Upload, X } from "lucide-react";
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
  
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

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

  const filteredProducts = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      product.itemCode.toLowerCase().includes(lowercasedFilter) ||
      product.category.toLowerCase().includes(lowercasedFilter)
    );
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
      setAllCategories([...allCategories, trimmedCategory].sort());
      setNewCategory("");
    }
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    setAllCategories(allCategories.filter(c => c !== categoryToDelete));
  };
  
  const handleBulkUpdate = async () => {
    if (!bulkUpdateCategory) {
      toast({ title: "Please select a category", variant: "destructive" });
      return;
    }
    if (selectedProductIds.length === 0) {
      toast({ title: "No products selected", variant: "destructive" });
      return;
    }

    await updateProductsCategory(selectedProductIds, bulkUpdateCategory);
    await fetchProductsAndCategories();
    setSelectedProductIds([]);
    setBulkUpdateCategory("");
    toast({ title: "Bulk Update Successful", description: `${selectedProductIds.length} products moved to "${bulkUpdateCategory}".`});
  };

  const handleFieldChange = (productId: string, field: keyof Product, value: any) => {
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === productId ? { ...p, [field]: value } : p
      )
    );
  };
  
  const handleImageChange = (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageSrc = e.target?.result as string;
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === productId ? { ...p, images: [newImageSrc, ...p.images.slice(1)], imageUpdatedAt: new Date().toISOString() } : p
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (productId: string) => {
    const productToSave = products.find(p => p.id === productId);
    if (productToSave) {
      await updateProduct(productToSave);
      toast({ title: "Product Saved", description: `${productToSave.name} has been updated.` });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await removeProduct(productId);
    setProducts(products.filter(p => p.id !== productId)); 
    toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
  };
  
  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length;

  if (loading) {
      return (
          <div className="container py-12">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1"><Skeleton className="h-64 w-full" /></div>
                  <div className="lg:col-span-3">
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
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                              </div>
                          </CardContent>
                      </Card>
                  </div>
              </div>
          </div>
      )
  }

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Add or remove product categories.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                        {allCategories.map(cat => (
                            <div key={cat} className="flex items-center justify-between rounded-md border p-2">
                                <span className="text-sm">{cat}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteCategory(cat)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 border-t pt-6">
                    <Label htmlFor="new-category">Add New Category</Label>
                    <div className="flex w-full space-x-2">
                        <Input id="new-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g., Vegetables"/>
                        <Button onClick={handleAddCategory}>Add</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                      <CardTitle>Manage Products</CardTitle>
                      <CardDescription>View, search, and edit products.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    <Button asChild>
                        <Link href="/developer/add-item">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add 
                        </Link>
                    </Button>
                  </div>
                </div>
            </CardHeader>
            <CardContent>
              {selectedProductIds.length > 0 && (
                <div className="flex items-center gap-4 p-4 mb-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{selectedProductIds.length} selected</p>
                  <Select value={bulkUpdateCategory} onValueChange={setBulkUpdateCategory}>
                      <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Move to category..." />
                      </SelectTrigger>
                      <SelectContent>
                          {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Button onClick={handleBulkUpdate}>Apply</Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20px] p-2"><Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} /></TableHead>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Retail</TableHead>
                    <TableHead>Wholesale</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id} data-state={selectedProductIds.includes(product.id) ? "selected" : ""}>
                      <TableCell className="p-2"><Checkbox checked={selectedProductIds.includes(product.id)} onCheckedChange={(checked) => handleSelectOne(product.id, !!checked)}/></TableCell>
                      <TableCell>
                        <div className="relative group w-16 h-16">
                          <Image src={product.images[0]} alt={product.name} width={64} height={64} className="rounded-md object-cover w-16 h-16"/>
                          <Label htmlFor={`image-upload-${product.id}`} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md">
                            <Upload className="h-5 w-5"/>
                          </Label>
                          <Input id={`image-upload-${product.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(product.id, e)} ref={(el) => fileInputRefs.current[product.id] = el}/>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}<br/><span className="text-xs text-muted-foreground">{product.itemCode}</span></TableCell>
                      <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                      <TableCell><Input type="number" value={product.retailPrice} onChange={(e) => handleFieldChange(product.id, 'retailPrice', e.target.valueAsNumber || 0)} className="w-24" step="0.01"/></TableCell>
                      <TableCell><Input type="number" value={product.wholesalePrice} onChange={(e) => handleFieldChange(product.id, 'wholesalePrice', e.target.valueAsNumber || 0)} className="w-24" step="0.01"/></TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleSaveProduct(product.id)}><Save className="h-4 w-4" /><span className="sr-only">Save</span></Button>
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
      </div>
    </div>
  );
}
