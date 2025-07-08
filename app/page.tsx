import ProductPage from "@/components/app/ProductPage";
import { getNewestProducts, getCategories } from '@/lib/data';
import { Product } from "@/types";

export default async function Home() {
  let dailyEssentialsProducts: Product[] = [];
  let categories: string[] = [];
  
  try {
    // Fetch critical data in parallel on the server before rendering the page.
    [dailyEssentialsProducts, categories] = await Promise.all([
      getNewestProducts(10),
      getCategories()
    ]);
  } catch (error) {
    console.error("Failed to fetch server-side data for homepage:", error);
    // In case of a database error, the page will still render with empty sections 
    // to prevent a full application crash. Errors are logged on the server.
  }
  
  return <ProductPage 
            serverRecommendedProducts={dailyEssentialsProducts} 
            serverCategories={categories}
         />;
}
