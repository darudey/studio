
import { Suspense } from "react";
import { getProducts, getRecommendedProducts } from "@/lib/data";
import ProductPage from "@/components/app/ProductPage";
import { Skeleton } from "@/components/ui/skeleton";

function ProductsSkeleton() {
  return (
    <div className="container py-8">
      <Skeleton className="h-24 w-full" />
      <div className="py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

async function Products() {
  // Fetch data on the server
  const [allProducts, recommendedProducts] = await Promise.all([
    getProducts(),
    getRecommendedProducts(),
  ]);

  return (
    <ProductPage
      allProducts={allProducts}
      recommendedProducts={recommendedProducts}
    />
  );
}

export default function Home() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <Products />
    </Suspense>
  );
}
