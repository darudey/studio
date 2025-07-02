
"use client";

import { useEffect, useState, useMemo, useCallback, startTransition } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProducts, updateProductsCategory, deleteMultipleProducts, renameCategory, deleteCategory } from "@/lib/data";
import type { Product } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, MoreHorizontal, Trash2, ListTree, FolderSymlink, Check, X, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog states
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isManageCategoryDialogOpen, setIsManageCategoryDialogOpen] = useState(false);
  
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [targetCategory, setTargetCategory] = useState("");


  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
      const uniqueCategories = [...new Set(data.map(p => p.category))].sort();
      setAllCategories(uniqueCategories);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch products.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push('/');
    } else {
      fetchProducts();
    }
  }, [user, router, fetchProducts]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;

    const lowercasedFilter = searchTerm.toLowerCase();
    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\\s\\W\\d_]/gi, '');
    const consonantFilter = getConsonants(lowercasedFilter);

    return products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(lowercasedFilter);
        const categoryMatch = product.category.toLowerCase().includes(lowercasedFilter);
        const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedFilter);
        
        if (nameMatch || categoryMatch || itemCodeMatch) return true;
        
        if (consonantFilter.length > 1) {
            if (getConsonants(product.name).includes(consonantFilter)) return true;
        }
        return false;
    });
  }, [searchTerm, products]);
  
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(pId => pId !== id));
  };
  
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredProducts.map(p => p.id) : []);
  };
  
  const handleBulkDelete = async () => {
    setIsProcessing(true);
    await deleteMultipleProducts(selectedIds);
    toast({ title: `${selectedIds.length} products deleted.` });
    setSelectedIds([]);
    await fetchProducts();
    setIsProcessing(false);
  };
  
  const handleBulkMove = async () => {
    if (!targetCategory) {
      toast({ title: "No category selected", description: "Please select a target category.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    await updateProductsCategory(selectedIds, targetCategory);
    toast({ title: "Products Moved", description: `${selectedIds.length} products moved to ${targetCategory}.` });
    setSelectedIds([]);
    setTargetCategory("");
    setIsMoveDialogOpen(false);
    await fetchProducts(); // Refresh data
    setIsProcessing(false);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName || oldName === newName) return;
    setIsProcessing(true);
    await renameCategory(oldName, newName);
    toast({ title: "Category Renamed", description: `"${oldName}" is now "${newName}".` });
    await fetchProducts();
    setIsProcessing(false);
  }

  const handleDeleteCategory = async (categoryName: string) => {
    setIsProcessing(true);
    await deleteCategory(categoryName);
    toast({ title: "Category Deleted", description: `Products from "${categoryName}" moved to "Uncategorized".` });
    await fetchProducts();
    setIsProcessing(false);
  }

  const RowSkeleton = () => (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="sticky top-16 z-10 border-b bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <ClipboardList className="h-6 w-6" />
            {selectedIds.length > 0 ? (
               <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                  <span className="font-semibold text-sm flex items-center gap-1.5"><Check className="h-4 w-4 text-green-600"/>{selectedIds.length} selected</span>
                  <div className="h-5 w-px bg-border" />
                  <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7"><FolderSymlink className="h-4 w-4 mr-2"/>Move</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Move to Category</DialogTitle>
                        <DialogDescription>Move the {selectedIds.length} selected products to a new or existing category.</DialogDescription>
                      </DialogHeader>
                      <Input
                        placeholder="Type new category or select existing"
                        value={targetCategory}
                        onChange={(e) => setTargetCategory(e.target.value)}
                        list="categories-list"
                      />
                      <datalist id="categories-list">
                        {allCategories.map(cat => <option key={cat} value={cat}/>)}
                      </datalist>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleBulkMove} disabled={isProcessing}>{isProcessing ? "Moving..." : "Move Products"}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 mr-2"/>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {selectedIds.length} products. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={isProcessing}>{isProcessing ? "Deleting..." : "Yes, delete"}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelectedIds([])}><X className="h-4 w-4 mr-2"/>Clear</Button>
               </div>
            ) : (
                <Input
                  placeholder="Search products by name, category, code..."
                  className="max-w-sm"
                  value={searchTerm}
                  onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
                />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isManageCategoryDialogOpen} onOpenChange={setIsManageCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><ListTree className="mr-2 h-4"/>Manage Categories</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] flex flex-col">
                <DialogHeader><DialogTitle>Manage Categories</DialogTitle><DialogDescription>Rename or delete existing categories. Changes will affect all products.</DialogDescription></DialogHeader>
                <div className="flex-1 overflow-y-auto -mx-6 px-6">
                  <div className="space-y-2">
                    {allCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between gap-2 rounded-md border p-2">
                        <span className="font-medium text-sm">{cat}</span>
                        <div className="flex items-center gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7">Rename</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Rename &quot;{cat}&quot;</AlertDialogTitle><AlertDialogDescription>Enter the new name for this category.</AlertDialogDescription></AlertDialogHeader>
                              <Input id={`rename-${cat}`} defaultValue={cat}/>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRenameCategory(cat, (document.getElementById(`rename-${cat}`) as HTMLInputElement).value)}>Rename</Button>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                             <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" disabled={cat === "Uncategorized"}>Delete</Button></AlertDialogTrigger>
                             <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete &quot;{cat}&quot;?</AlertDialogTitle><AlertDialogDescription>Products in this category will be moved to &quot;Uncategorized&quot;. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCategory(cat)}>Yes, delete</AlertDialogAction>
                              </AlertDialogFooter>
                             </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button asChild size="sm">
              <Link href="/developer/add-item"><PlusCircle className="mr-2 h-4"/>Add Product</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-[1]">
            <TableRow>
              <TableHead className="w-[50px]"><Checkbox onCheckedChange={handleSelectAll} checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} /></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Retail Price</TableHead>
              <TableHead>Wholesale Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="w-[50px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                [...Array(10)].map((_, i) => <RowSkeleton key={i} />)
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <TableRow key={p.id} data-state={selectedIds.includes(p.id) ? "selected" : "unselected"}>
                  <TableCell><Checkbox onCheckedChange={(checked) => handleSelectOne(p.id, !!checked)} checked={selectedIds.includes(p.id)} /></TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>₹{p.retailPrice.toFixed(2)}</TableCell>
                  <TableCell>₹{p.wholesalePrice.toFixed(2)}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell className="text-right">
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onSelect={() => router.push(`/developer/products/edit/${p.id}`)}>Edit</DropdownMenuItem>
                         <DropdownMenuItem>View</DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">No products found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>
    </div>
  );
}
