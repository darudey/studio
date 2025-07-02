"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts, updateProduct } from "@/lib/data";
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

export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
        const data = await getProducts();
        setProducts(data);
        const uniqueCategories = [...new Set(data.map(p => p.category))].sort();
        setAllCategories(uniqueCategories);
    } catch(err) {
        toast({ title: "Error", description: "Failed to load products.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }
    fetchProducts();
  }, [user, router, fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[^bcdfghjklmnpqrstvwxyz]/gi, '');
    const consonantFilter = getConsonants(searchTerm);

    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
      const categoryMatch = product.category.toLowerCase().includes(lowercasedFilter);
      const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedFilter);
      
      if (nameMatch || categoryMatch || itemCodeMatch) {
        return true;
      }
      
      if (consonantFilter.length >= 2) {
        const nameConsonants = getConsonants(product.name);
        if (nameConsonants.includes(consonantFilter)) {
            return true;
        }
      }

      return false;
    });
  }, [searchTerm, products]);


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
      toast({ title: "Success", description: "Product updated successfully." });
      
      // Refresh the product list by calling fetchProducts
      fetchProducts();
      
      setEditingProduct(null); // Close dialog on success
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

  if (!user) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Product Catalog
        </h1>
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {editingProduct && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
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
                  <Input id="category" name="category" value={editingProduct.category} onChange={handleFormChange} list="categories-list" className="col-span-3" />
                   <datalist id="categories-list">
                      {allCategories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
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
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)} disabled={isSaving}>Cancel</Button>
                <Button type="button" onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
         </div>
      ) : filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
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
