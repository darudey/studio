
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPaginatedProducts, getCategories, updateProduct, renameCategory, deleteCategory } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "@/components/app/ProductForm";
import { ClipboardList, Loader2, Hash, Pencil, Trash2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";


export default function ManageProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(true);
  
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const { toast } = useToast();

  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategory, setRenamingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [isCategoryActionLoading, setIsCategoryActionLoading] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const limit = 20;

  const fetchProducts = useCallback(async (query: string, pageNum: number) => {
    if (pageNum === 1) setIsSearching(true);
    else setLoading(true);
    
    const { products: newProducts, more } = await getPaginatedProducts({ search: query, page: pageNum, limit });
    
    setProducts(prev => pageNum === 1 ? newProducts : [...prev, ...newProducts]);
    setHasMore(more);
    setPage(pageNum);

    setLoading(false);
    setIsSearching(false);
  }, []);

  const debouncedFetch = useMemo(() => {
    return debounce((query: string) => fetchProducts(query, 1), 300);
  }, [fetchProducts]);

  const refreshAllData = useCallback(async () => {
    setIsCategoryActionLoading(true);
    await fetchProducts(searchTerm, 1);
    const cats = await getCategories();
    setAllCategories(cats);
    setIsCategoryActionLoading(false);
  }, [fetchProducts, searchTerm]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }
    
    getCategories().then(setAllCategories);

    debouncedFetch(searchTerm);
    return () => debouncedFetch.cancel();
  }, [user, authLoading, router, searchTerm, debouncedFetch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(searchTerm, page + 1);
    }
  };

  const handleEditClick = async (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };
  
  const handleFormSubmit = async (data: any, images: string[]) => {
      if (!editingProduct) return;
      setIsSubmitting(true);
      
      const imageChanged = JSON.stringify(images) !== JSON.stringify(editingProduct.images.filter(img => !img.includes('placehold.co')));
      const updatedProductData: Product = {
          ...editingProduct,
          ...data,
          images,
          imageUpdatedAt: imageChanged ? new Date().toISOString() : editingProduct.imageUpdatedAt,
      };

      try {
          await updateProduct(updatedProductData);
          setProducts(currentProducts => 
            currentProducts.map(p => 
                p.id === editingProduct.id ? updatedProductData : p
            )
          );
          toast({
              title: "Product Updated",
              description: `${data.name} has been updated.`,
          });
          setIsEditDialogOpen(false);
          setEditingProduct(null);
      } catch (error) {
          console.error("Failed to update product", error);
          toast({ title: "Error", description: "Failed to update product.", variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleAddNewCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName || allCategories.find((c) => c.toLowerCase() === trimmedName.toLowerCase())) {
      toast({ title: "Invalid or Duplicate Category", description: "Category name cannot be empty and must be unique.", variant: "destructive" });
      return;
    }
    setAllCategories(prev => [...prev, trimmedName].sort());
    setNewCategoryName("");
    toast({ title: "Category Added Temporarily", description: `"${trimmedName}" is available. Assign it to a product to save permanently.` });
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
          toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
      } finally {
          setIsCategoryActionLoading(false);
      }
  };
  
  if (authLoading || !user) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }
  
  const AdminProductCard = ({ product }: { product: Product }) => {
    return (
        <Card onClick={() => handleEditClick(product)} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2">CG: {product.category}</p>
                        <p className="text-sm text-muted-foreground">RP: ₹{product.retailPrice.toFixed(0)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                         <p className="text-sm text-muted-foreground">ST: {product.stock}</p>
                         <p className="text-sm text-muted-foreground">WP: ₹{product.wholesalePrice.toFixed(0)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="container py-12">
      <div className="sticky top-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4 mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-blue-600" /> Product Catalog
        </h1>
        <div className="flex items-center gap-2">
            <div className="relative">
              <Input placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm pr-8" />
              {isSearching && page === 1 && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
             <Button variant="outline" size="icon" onClick={() => setIsCategoryManagerOpen(true)} title="Manage Categories">
                <Hash className="h-4 w-4 text-blue-600" /> <span className="sr-only">Manage Categories</span>
            </Button>
        </div>
      </div>
      
      <Dialog open={isCategoryManagerOpen} onOpenChange={(open) => { if (!open) setRenamingCategory(null); setIsCategoryManagerOpen(open); }}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Manage Categories</DialogTitle><DialogDescription>Add, rename, or delete product categories.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-2">
                    <Input placeholder="New category name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} disabled={isCategoryActionLoading} />
                    <Button onClick={handleAddNewCategory} disabled={isCategoryActionLoading}>Add</Button>
                </div>
                <ScrollArea className="h-64"><div className="space-y-2 pr-4">{allCategories.map(cat => (<div key={cat} className="flex items-center justify-between gap-2 p-2 rounded-md border">{renamingCategory?.oldName === cat ? (<Input value={renamingCategory.newName} onChange={(e) => setRenamingCategory({...renamingCategory, newName: e.target.value})} onBlur={handleRenameCategory} onKeyDown={(e) => { if(e.key === 'Enter') handleRenameCategory() }} autoFocus className="h-8" disabled={isCategoryActionLoading} />) : (<span className="font-medium text-sm">{cat}</span>)}<div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartRename(cat)} disabled={cat === "Uncategorized" || isCategoryActionLoading}><Pencil className="h-4 w-4 text-blue-600"/></Button><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCategoryToDelete(cat)} disabled={cat === "Uncategorized" || isCategoryActionLoading}><Trash2 className="h-4 w-4 text-red-600"/></Button></div></div>))}</div></ScrollArea>
            </div>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!categoryToDelete} onOpenChange={(isOpen) => !isOpen && setCategoryToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will delete the category &quot;{categoryToDelete}&quot; and move all its products to &quot;Uncategorized&quot;. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel disabled={isCategoryActionLoading}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteCategory} disabled={isCategoryActionLoading}>{isCategoryActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) { setEditingProduct(null); setIsEditDialogOpen(false); }}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the details for &quot;{editingProduct?.name}&quot;.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1">
             <ProductForm 
                product={editingProduct}
                categories={allCategories}
                onFormSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {(isSearching && page === 1) ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => <Skeleton key={`skeleton-${i}`} className="h-24 w-full" />)}
        </div>
      ) : products.length > 0 ? (
        <div className="space-y-4">
          {products.map(p => <AdminProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="text-center py-10">No products found.</div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Loading...</> : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
