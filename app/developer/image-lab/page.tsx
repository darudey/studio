
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/data";
import type { Product } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Edit } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export default function ManageProductImagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!['developer', 'shop-owner', 'imager'].includes(user.role)) {
      router.push("/");
      return;
    }

    getProducts().then(data => {
      setProducts(data);
      setLoading(false);
    }).catch(err => {
        console.error("Failed to load products", err);
        setLoading(false);
    });
  }, [user, router]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProductImageSkeleton = () => (
      <Card>
          <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
              <div className="col-span-2 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-24 mt-2" />
              </div>
              <div className="col-span-1">
                  <Skeleton className="w-full aspect-square rounded-md" />
              </div>
          </CardContent>
      </Card>
  )

  if (!user || !['developer', 'shop-owner', 'imager'].includes(user.role)) {
    return <div className="container py-12 text-center">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Image Lab
        </h1>
        <Input 
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <ProductImageSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(p => (
            <Card key={p.id}>
                <CardContent className="p-4 grid grid-cols-3 gap-4 items-center">
                    <div className="col-span-2">
                        <p className="font-semibold leading-tight">{p.name}</p>
                        <p className="text-sm text-muted-foreground">{p.itemCode}</p>
                         <Button asChild size="sm" className="mt-4">
                            <Link href={`/developer/products/edit/${p.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Image
                            </Link>
                         </Button>
                    </div>
                    <div className="col-span-1">
                        <Link href={`/developer/products/edit/${p.id}`} className="block">
                            <div className="w-full aspect-square rounded-md relative overflow-hidden border">
                                <Image 
                                    src={p.images[0] || 'https://placehold.co/400x400.png'}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={p.dataAiHint}
                                />
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
