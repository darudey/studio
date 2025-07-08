import ProductPage from "@/components/app/ProductPage";
import { getRecentlyUpdatedProducts, getCategories, getProducts } from '@/lib/data';
import { Product } from "@/types";

export default async function Home() {
  let dailyEssentialsProducts: Product[] = [];
  let allProducts: Product[] = [];
  let categories: string[] = [];
  
  try {
    // Fetch critical data in parallel on the server before rendering the page.
    [dailyEssentialsProducts, categories, allProducts] = await Promise.all([
      getRecentlyUpdatedProducts(10),
      getCategories(),
      getProducts()
    ]);
  } catch (error) {
    console.error("Failed to fetch server-side data for homepage:", error);
    // In case of a database error, the page will still render with empty sections 
    // to prevent a full application crash. Errors are logged on the server.
  }
  
  return <ProductPage 
            serverRecommendedProducts={dailyEssentialsProducts} 
            serverCategories={categories}
            serverAllProducts={allProducts}
         />;
}
