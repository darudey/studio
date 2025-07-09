import ProductPage from "@/components/app/ProductPage";
import { getProducts, getCategorySettings } from '@/lib/data';
import { Product, Category } from "@/types";

// Helper function to extract categories from a product list.
// This avoids an extra database call.
function getCategoriesFromProducts(products: Product[]): string[] {
    const categoriesSet = new Set(products.map(p => p.category));
    const categories = Array.from(categoriesSet).sort();
    if (!categories.includes("Uncategorized")) {
        return ["Uncategorized", ...categories];
    }
    return categories;
}

// Helper function to get recently updated products from a list.
// This avoids an extra database call.
function getRecentlyUpdatedFromProducts(products: Product[], limit: number): Product[] {
    // Create a copy before sorting to avoid mutating the original array
    const sorted = [...products].sort((a, b) => {
        // Handle cases where updatedAt might be missing
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
  let categorySettings: Category[] = [];
  
  try {
    // Fetch all products and settings just ONCE. This is the key optimization.
    [allProducts, categorySettings] = await Promise.all([
      getProducts(),
      getCategorySettings(),
    ]);
    
    // Derive categories and "daily essentials" from the single list of products in memory.
    categories = getCategoriesFromProducts(allProducts);
    dailyEssentialsProducts = getRecentlyUpdatedFromProducts(allProducts, 10);

  } catch (error) {
    console.error("Failed to fetch server-side data for homepage:", error);
    // In case of a database error, the page will still render with empty sections 
    // to prevent a full application crash. Errors are logged on the server.
  }
  
  const settingsMap = categorySettings.reduce((acc, setting) => {
    acc[setting.id] = setting.imageUrl;
    return acc;
  }, {} as Record<string, string>);

  return <ProductPage 
            serverRecommendedProducts={dailyEssentialsProducts} 
            serverAllProducts={allProducts}
            serverCategories={categories}
            serverCategorySettingsMap={settingsMap}
         />;
}
