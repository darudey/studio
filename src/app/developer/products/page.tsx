
"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { products as allProducts, deleteProduct as removeProduct, updateProduct } from "@/lib/data";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash, PlusCircle, Save, Upload } from "lucide-react";
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

export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!['developer', 'shop-owner'].includes(user.role)) {
      toast({ title: "Access Denied", description: "This page is for administrators only.", variant: "destructive" });
      router.push("/");
    } else {
        setProducts(JSON.parse(JSON.stringify(allProducts)));
    }
  }, [user, router, toast]);

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

  const handleSaveProduct = (productId: string) => {
    const productToSave = products.find(p => p.id === productId);
    if (productToSave) {
      updateProduct(productToSave);
      toast({ title: "Product Saved", description: `${productToSave.name} has been updated.` });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    removeProduct(productId);
    setProducts(products.filter(p => p.id !== productId)); 
    toast({ title: "Product Deleted", description: "The product has been removed from the catalog." });
  };

  if (!user || !['developer', 'shop-owner'].includes(user.role)) {
    return <div className="container text-center py-10">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Products</CardTitle>
                <CardDescription>View and edit products directly in the table below.</CardDescription>
            </div>
            <Button asChild>
                <Link href="/developer/add-item">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Product
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Item Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Retail Price</TableHead>
                <TableHead>Wholesale</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative group w-16 h-16">
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        width={64}
                        height={64}
                        className="rounded-md object-cover w-16 h-16"
                      />
                      <Label htmlFor={`image-upload-${product.id}`} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md">
                        <Upload className="h-5 w-5"/>
                      </Label>
                      <Input 
                        id={`image-upload-${product.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageChange(product.id, e)}
                        ref={(el) => fileInputRefs.current[product.id] = el}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{product.itemCode}</TableCell>
                  <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={product.retailPrice}
                      onChange={(e) => handleFieldChange(product.id, 'retailPrice', e.target.valueAsNumber || 0)}
                      className="w-24"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>
                     <Input 
                      type="number" 
                      value={product.wholesalePrice}
                      onChange={(e) => handleFieldChange(product.id, 'wholesalePrice', e.target.valueAsNumber || 0)}
                      className="w-24"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleSaveProduct(product.id)}>
                            <Save className="h-4 w-4" />
                            <span className="sr-only">Save</span>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                            <Link href={`/developer/products/edit/${product.id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Full Details</span>
                            </Link>
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the product
                                    &quot;{product.name}&quot;.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
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
