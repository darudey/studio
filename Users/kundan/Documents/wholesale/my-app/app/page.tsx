
import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch only the "Recommended" products for the initial, fast load.
  // This is more robust than relying on a hardcoded category name.
  const initialRecommendedProducts = await getRecommendedProducts();
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return <ProductPage initialRecommendedProducts={initialRecommendedProducts} />;
}
