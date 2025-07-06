
import ProductPage from "@/components/app/ProductPage";
import { getProducts, getRecommendedProducts } from "@/lib/data";
import { Suspense } from "react";
import LoadingAnimation from "@/components/app/LoadingAnimation";

// This is an async Server Component
export default async function Home() {
  // By fetching all data on the server, we avoid a slow secondary fetch on the client.
  // The Suspense boundary will handle the initial server render time.
  const [allProducts, recommendedProducts] = await Promise.all([
    getProducts(),
    getRecommendedProducts()
  ]);

  // Pass the server-fetched data as props to the client component.
  return <ProductPage allProducts={allProducts} recommendedProducts={recommendedProducts} />;
}
