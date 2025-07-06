
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { updateProduct } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAllProducts } from "@/hooks/use-swr-data";
import { Progress } from "@/components/ui/progress";

export default function ManageProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const { products: allProducts, isLoading: productsLoading, mutate: mutateProducts } = useAllProducts();
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const isLoading = authLoading || productsLoading;
  const [progress, setProgress] = useState(13);

  const categories = useMemo(() => {
    if (!allProducts) return [];
    return [...new Set(allProducts.map(p => p.category))].sort();
  }, [allProducts]);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setProgress(66), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (!searchTerm) return allProducts;

    const lowercasedSearch = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\s\W\d_]/gi, '');
    const consonantFilter = getConsonants(lowercasedSearch);

    return allProducts.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedSearch);
      const categoryMatch = product.category.toLowerCase().includes(lowercasedSearch);
      const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedSearch);

      if (nameMatch || categoryMatch || itemCodeMatch) return true;

      if (consonantFilter.length > 1) {
          if (getConsonants(product.name).includes(consonantFilter)) return true;
      }
      return false;
    });
  }, [allProducts, searchTerm]);

  // Client-side pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, currentPage * productsPerPage);
  }, [filteredProducts, currentPage, productsPerPage]);

  const hasMore = paginatedProducts.length < filteredProducts.length;

  const loadMore = () => {
    if (hasMore) {
        setCurrentPage(prev => prev + 1);
    }
  };
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editingProduct) return;
    const { name, value } = e.target;
    setEditingProduct({ ...editingProduct, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [name]: value });
  };

  const handleSaveChanges = async () => {
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      const productToUpdate: Product = {
        ...editingProduct,
        retailPrice: Number(editingProduct.retailPrice) || 0,
        wholesalePrice: Number(editingProduct.wholesalePrice) || 0,
        stock: Number(editingProduct.stock) || 0,
      };

      await updateProduct(productToUpdate);
      
      mutateProducts(currentProducts => currentProducts?.map(p => p.id === productToUpdate.id ? productToUpdate : p), false);
      
      toast({ title: "Success", description: "Product updated successfully." });
      setEditingProduct(null);
    } catch (error) {
      console.error("Failed to update product", error);
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const ProductCardSkeleton = () => (
      <div className="border p-4 rounded-lg shadow-sm space-y-3">
        <Skeleton className="h-5 bg-muted rounded w-3/4" />
        <div className="space-y-2 pt-2 border-t border-muted/20">
            <div className="flex justify-between">
                <Skeleton className="h-4 bg-muted rounded w-1/2" />
                <Skeleton className="h-4 bg-muted rounded w-1/4" />
            </div>
            <div className="flex justify-between">
                <Skeleton className="h-4 bg-muted rounded w-1/3" />
                <Skeleton className="h-4 bg-muted rounded w-1/3" />
            </div>
        </div>
      </div>
  );
  
  if (isLoading) {
    return (
        <div className="container py-12">
            <Progress value={progress} className="w-full mb-8" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
        </div>
    )
  }

  if (authLoading || !user) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            Product Catalog
        </h1>
        <div className="flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
        </div>
      </div>

      <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          {editingProduct && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Edit Product</DialogTitle>
                  <Button type="button" size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
                <DialogDescription>
                  Make changes to &quot;{editingProduct.name}&quot;. Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" value={editingProduct.name} onChange={handleFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea id="description" name="description" value={editingProduct.description} onChange={handleFormChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                    <Select name="category" value={editingProduct.category} onValueChange={(value) => handleSelectChange('category', value)}>
                        <SelectTrigger className="col-span-3" id="category">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="itemCode" className="text-right">Item Code</Label>
                  <Input id="itemCode" name="itemCode" value={editingProduct.itemCode} onChange={handleFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="batchNo" className="text-right">Batch No.</Label>
                  <Input id="batchNo" name="batchNo" value={editingProduct.batchNo} onChange={handleFormChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="retailPrice" className="text-right">Retail Price (₹)</Label>
                  <Input id="retailPrice" name="retailPrice" type="number" value={editingProduct.retailPrice} onChange={handleFormChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="wholesalePrice" className="text-right">Wholesale Price (₹)</Label>
                  <Input id="wholesalePrice" name="wholesalePrice" type="number" value={editingProduct.wholesalePrice} onChange={handleFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stock" className="text-right">Stock</Label>
                  <Input id="stock" name="stock" type="number" value={editingProduct.stock} onChange={handleFormChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="text-right">Unit</Label>
                  <Select name="unit" value={editingProduct.unit} onValueChange={(value) => handleSelectChange('unit', value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="g">Gram (g)</SelectItem>
                      <SelectItem value="litre">Litre (litre)</SelectItem>
                      <SelectItem value="ml">Millilitre (ml)</SelectItem>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="dozen">Dozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingProduct(null)}
                  disabled={isSaving}
                  className="w-full"
                >
                  Cancel
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {paginatedProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedProducts.map((p) => (
              <button key={p.id} className="border p-4 rounded-lg shadow-sm text-left hover:shadow-md transition-shadow flex flex-col" onClick={() => setEditingProduct(p)}>
                <h4 className="font-medium truncate flex-grow">{p.name}</h4>
                <div className="mt-2 pt-2 border-t border-muted/20 text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between items-center gap-2">
                        <span className="truncate"><span className="font-semibold text-foreground/80">CG:</span> {p.category}</span>
                        <span className="flex-shrink-0"><span className="font-semibold text-foreground/80">ST:</span> {p.stock}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                        <span><span className="font-semibold text-foreground/80">RP:</span> ₹{p.retailPrice.toFixed(0)}</span>
                        <span><span className="font-semibold text-foreground/80">WP:</span> ₹{p.wholesalePrice.toFixed(0)}</span>
                    </div>
                </div>
              </button>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore}>
                Load More
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No products found</h2>
          <p className="text-muted-foreground mt-2">Try adjusting your search.</p>
        </div>
      )}
    </div>
  );
}
