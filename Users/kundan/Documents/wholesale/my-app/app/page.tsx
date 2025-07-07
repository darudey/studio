
import ProductPage from "@/components/app/ProductPage";
import { getCategories, getProductsByCategoryName } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch initial data on the server for a fast initial load.
  // Running these in parallel improves performance.
  const [initialDailyEssentials, initialCategories] = await Promise.all([
    getProductsByCategoryName("daily essentials", 10),
    getCategories()
  ]);
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return <ProductPage 
    initialDailyEssentials={initialDailyEssentials} 
    initialCategories={initialCategories}
  />;
}
