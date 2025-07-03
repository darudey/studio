
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPaginatedProducts, updateProduct, getProducts, renameCategory, deleteCategory } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2, Hash, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // State for category management
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isCategoryActionLoading, setIsCategoryActionLoading] = useState(false);

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

  const refreshAllData = useCallback(() => {
    fetchProducts(searchTerm, 1);
    getProducts().then(allProds => {
      const uniqueCategories = [...new Set(allProds.map(p => p.category))].sort();
      setAllCategories(uniqueCategories);
    });
  }, [fetchProducts, searchTerm]);

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

  // Category Management Handlers
  const handleAddNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName || allCategories.find(c => c.toLowerCase() === trimmedName.toLowerCase())) {
        toast({ title: "Invalid Category", description: "Category name cannot be empty or a duplicate.", variant: "destructive" });
        return;
    }
    setAllCategories(prev => [...prev, trimmedName].sort());
    setNewCategoryName("");
    toast({ title: "Category Added", description: `"${trimmedName}" is now available. Assign it to a product to save it.` });
  };

  const handleStartRename = (category: string) => {
    setRenamingCategory({ oldName: category, newName: category });
  };

  const handleRenameCategory = async () => {
      if (!renamingCategory) return;
      const trimmedNewName = renamingCategory.newName.trim();
      
      if (!trimmedNewName || trimmedNewName.toLowerCase() === renamingCategory.oldName.toLowerCase()) {
          setRenamingCategory(null);
          return;
      }
      if (allCategories.find(c => c.toLowerCase() === trimmedNewName.toLowerCase())) {
          toast({ title: "Rename Failed", description: "A category with that name already exists.", variant: "destructive" });
          return;
      }

      setIsCategoryActionLoading(true);
      try {
          await renameCategory(renamingCategory.oldName, trimmedNewName);
          toast({ title: "Category Renamed", description: `"${renamingCategory.oldName}" was renamed to "${trimmedNewName}".` });
          refreshAllData();
          setRenamingCategory(null);
      } catch (error) {
          console.error("Failed to rename category", error);
          toast({ title: "Error", description: "Failed to rename category.", variant: "destructive" });
      } finally {
          setIsCategoryActionLoading(false);
      }
  };
  
  const handleDeleteCategory = async () => {
      if (!categoryToDelete) return;

      setIsCategoryActionLoading(true);
      try {
          await deleteCategory(categoryToDelete);
          toast({ title: "Category Deleted", description: `Products in "${categoryToDelete}" were moved to "Uncategorized".` });
          refreshAllData();
          setCategoryToDelete(null);
      } catch (error) {
          console.error("Failed to delete category", error);
          toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
      } finally {
          setIsCategoryActionLoading(false);
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
        <ClipboardList className="h-6 w-6 text-blue-600" />
        <div className="flex items-center gap-2">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" size="icon" onClick={() => setIsCategoryManagerOpen(true)} title="Manage Categories">
                <Hash className="h-4 w-4 text-blue-600" />
                <span className="sr-only">Manage Categories</span>
            </Button>
        </div>
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
      
      <Dialog open={isCategoryManagerOpen} onOpenChange={(isOpen) => !isOpen && setRenamingCategory(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>Add, rename, or delete product categories.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input 
                        placeholder="New category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button onClick={handleAddNewCategory}>Add</Button>
                </div>
                <ScrollArea className="h-64">
                    <div className="space-y-2 pr-4">
                        {allCategories.map(cat => (
                            <div key={cat} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                                {renamingCategory?.oldName === cat ? (
                                    <Input 
                                        value={renamingCategory.newName}
                                        onChange={(e) => setRenamingCategory({...renamingCategory, newName: e.target.value})}
                                        onBlur={handleRenameCategory}
                                        onKeyDown={(e) => { if(e.key === 'Enter') handleRenameCategory() }}
                                        autoFocus
                                        className="h-8"
                                    />
                                ) : (
                                    <span className="font-medium text-sm">{cat}</span>
                                )}
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartRename(cat)} disabled={cat === "Uncategorized"}>
                                        <Pencil className="h-4 w-4 text-blue-600"/>
                                    </Button>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCategoryToDelete(cat)} disabled={cat === "Uncategorized"}>
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => !isOpen && setCategoryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will delete the category &quot;{categoryToDelete}&quot; and move all its products to &quot;Uncategorized&quot;. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isCategoryActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} disabled={isCategoryActionLoading}>
                {isCategoryActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {isSearching ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
         </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
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

    