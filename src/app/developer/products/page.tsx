// WIP: Updated Manage Products Page with Sticky Sub-Header, Icon UI, and Consonant-Match Optimization

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getProducts } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PlusCircle, ListTree } from "lucide-react";
import { Product } from "@/types";

export default function ManageProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetch = async () => {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    };

    fetch();
  }, [user, router]);

  const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\s\W\d_]/gi, "");

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const filter = searchTerm.toLowerCase();
    const consonants = getConsonants(filter);

    return products.filter((product) => {
      const name = product.name.toLowerCase();
      const cat = product.category.toLowerCase();
      const item = product.itemCode?.toLowerCase() || "";
      const cons = getConsonants(product.name);

      return (
        name.includes(filter) ||
        cat.includes(filter) ||
        item.includes(filter) ||
        (consonants.length > 1 && cons.includes(consonants))
      );
    });
  }, [searchTerm, products]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container py-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background py-2 shadow-sm border-b flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Search..."
            className="w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline" className="hidden md:flex">
            <ListTree className="h-4 w-4 mr-2" /> Categories
          </Button>
          <Button className="hidden md:flex">
            <PlusCircle className="h-4 w-4 mr-2" /> Add
          </Button>
        </div>
      </div>

      {/* Product List */}
      <Card className="mt-4 max-h-[70vh] overflow-auto">
        <CardHeader>
          <CardTitle>Manage Products</CardTitle>
          <CardDescription>Scroll to view and manage items.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((p) => (
              <div key={p.id} className="p-4 border rounded-lg shadow">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </div>
            ))}
            {filteredProducts.length === 0 && <p>No products found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
