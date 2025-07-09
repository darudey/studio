
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getPaginatedProducts, getCategories, renameCategory, deleteCategory } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Loader2, Hash, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Retail Price</TableHead>
              <TableHead>Wholesale Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isSearching && page === 1) ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : products.length > 0 ? (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.name}
                    {p.isRecommended && <Badge variant="secondary" className="ml-2">Recommended</Badge>}
                  </TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>₹{p.retailPrice.toFixed(2)}</TableCell>
                  <TableCell>₹{p.wholesalePrice.toFixed(2)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/developer/products/edit/${p.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="mt-8 text-center">
          <Button onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
