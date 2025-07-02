
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPaginatedProducts, updateProduct, getProducts } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(true);

  // State for the edit dialog
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const limit = 20;

  const fetchProducts = useCallback(async (query: string, pageNum: number) => {
    if (pageNum === 1) {
      setIsSearching(true);
    } else {
      setLoading(true);
    }
    
    const { products: newProducts, more } = await getPaginatedProducts({
      search: query,
      page: pageNum,
      limit,
    });
    
    setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
    setHasMore(more);
    setPage(pageNum);

    setLoading(false);
    setIsSearching(false);
  }, []);

  const debouncedFetch = useMemo(() => {
    return debounce((query: string) => {
      fetchProducts(query, 1);
    }, 300);
  }, [fetchProducts]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }

    // Fetch all categories for the edit dialog dropdown
    getProducts().then(allProds => {
      const uniqueCategories = [...new Set(allProds.map(p => p.category))].sort();
      setAllCategories(uniqueCategories);
    });

    debouncedFetch(searchTerm);
    return () => {
      debouncedFetch.cancel();
    };
  }, [user, router, searchTerm, debouncedFetch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(searchTerm, page + 1);
    }
  };

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
      // Coerce prices and stock to numbers before saving
      const productToUpdate: Product = {
        ...editingProduct,
        retailPrice: Number(editingProduct.retailPrice) || 0,
        wholesalePrice: Number(editingProduct.wholesalePrice) || 0,
        stock: Number(editingProduct.stock) || 0,
      };

      await updateProduct(productToUpdate);
      toast({ title: "Success", description: "Product updated successfully." });
      
      // Refresh the product list
      fetchProducts(searchTerm, 1);
      
      setEditingProduct(null); // Close dialog on success
    } catch (error) {
      console.error("Failed to update product", error);
      toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const ProductCardSkeleton = () => (
      <div className="border p-4 rounded-lg shadow-sm space-y-2">
        <Skeleton className="h-5 bg-muted rounded w-3/4" />
        <Skeleton className="h-4 bg-muted rounded w-1/2" />
      </div>
  );

  if (!user) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 mb-6 flex justify-between items-center">
        <ClipboardList className="h-6 w-6" />
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

      {isSearching ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
         </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <button key={p.id} className="border p-4 rounded-lg shadow-sm text-left hover:shadow-md transition-shadow" onClick={() => setEditingProduct(p)}>
                <h4 className="font-medium truncate">{p.name}</h4>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </button>
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <Button onClick={loadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
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

