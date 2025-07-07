
import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts, getCategories } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch recommended products and the category list for a fast initial load.
  const [initialRecommendedProducts, initialCategories] = await Promise.all([
    getRecommendedProducts(),
    getCategories(),
  ]);
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return (
    <ProductPage 
      initialRecommendedProducts={initialRecommendedProducts}
      initialCategories={initialCategories}
    />
  );
}
