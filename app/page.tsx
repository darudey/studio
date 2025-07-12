import ProductPage from "@/components/app/ProductPage";
import { getProducts } from '@/lib/data';
import { Product } from "@/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function getCategoriesFromProducts(products: Product[]): string[] {
    const categoriesSet = new Set(products.map(p => p.category));
    const categories = Array.from(categoriesSet).sort();
    if (!categories.includes("Uncategorized")) {
        return ["Uncategorized", ...categories];
    }
    return categories;
}

function getRecentlyUpdatedFromProducts(products: Product[], limit: number): Product[] {
    const sorted = [...products].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
    });
    return sorted.slice(0, limit);
}


export default async function Home() {
  let allProducts: Product[] = [];
  let categories: string[] = [];
  let dailyEssentialsProducts: Product[] = [];
  
  try {
    allProducts = await getProducts();
    categories = getCategoriesFromProducts(allProducts);
    dailyEssentialsProducts = getRecentlyUpdatedFromProducts(allProducts, 10);

  } catch (error) {
    console.error("Failed to fetch server-side data for homepage:", error);
  }

  return (
    <Suspense fallback={<HomePageSkeleton />}>
        <ProductPage 
            serverRecommendedProducts={dailyEssentialsProducts} 
            serverAllProducts={allProducts}
            serverCategories={categories}
        />
    </Suspense>
  );
}

function HomePageSkeleton() {
    return (
        <div className="container py-12">
            <Skeleton className="h-10 w-1/3 mb-6" />
            <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                    <div key={i}>
                        <Skeleton className="h-8 w-1/4 mb-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
