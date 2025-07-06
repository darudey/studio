
import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts, getNewestProducts, getCategories } from "@/lib/data";
import { Suspense } from "react";
import LoadingAnimation from "@/components/app/LoadingAnimation";

// This is an async Server Component
export default async function Home() {
  // Fetch only the essential data for the initial, fast-loading view.
  const [recommendedProducts, newestProducts, allCategories] = await Promise.all([
    getRecommendedProducts(),
    getNewestProducts(20),
    getCategories()
  ]);

  // Pass the server-fetched data as props to the client component.
  // The full product list will be lazy-loaded on the client when needed.
  return (
    <Suspense fallback={<LoadingAnimation />}>
      <ProductPage 
        recommendedProducts={recommendedProducts} 
        newestProducts={newestProducts}
        allCategories={allCategories}
      />
    </Suspense>
  );
}
