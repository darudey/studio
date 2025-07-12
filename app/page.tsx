
import { getProducts, getCategories } from '@/lib/data';
import { Product } from "@/types";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from '@/components/app/ProductGrid';
import CategoryNav from '@/components/app/CategoryNav';

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
    categories = await getCategories();
    dailyEssentialsProducts = getRecentlyUpdatedFromProducts(allProducts, 10);

  } catch (error) {
    console.error("Failed to fetch server-side data for homepage:", error);
  }

  return (
    <div className="bg-background min-h-screen">
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <CategoryNav serverCategories={categories} />
      </Suspense>
      
      <Suspense fallback={<HomePageSkeleton />}>
        <ProductGrid 
            serverRecommendedProducts={dailyEssentialsProducts} 
            serverAllProducts={allProducts}
        />
      </Suspense>
    </div>
  );
}

function HomePageSkeleton() {
    return (
        <div className="container py-12">
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
                 <div>
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

