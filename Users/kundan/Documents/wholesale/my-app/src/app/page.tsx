
import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts, getNewestProducts } from "@/lib/data";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// This component defines the loading skeleton for the home page.
const HomePageSkeleton = () => (
    <div className="container py-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full mt-4" />
        <Skeleton className="h-8 w-48 my-6" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 mt-6">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-72 w-full" />)}
        </div>
    </div>
);

// This is an async Server Component
export default async function Home() {
  // Fetch only the essential data for the initial, fast-loading view.
  const [recommendedProducts, newestProducts] = await Promise.all([
    getRecommendedProducts(),
    getNewestProducts(40), // Fetch a slightly larger batch to get a good category list
  ]);

  // Efficiently derive categories from the products we already have
  const allCategories = [...new Set(newestProducts.map(p => p.category))].sort();

  // Pass the server-fetched data as props to the client component.
  // The full product list will be lazy-loaded on the client when needed.
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <ProductPage 
        recommendedProducts={recommendedProducts} 
        newestProducts={newestProducts}
        allCategories={allCategories}
      />
    </Suspense>
  );
}
