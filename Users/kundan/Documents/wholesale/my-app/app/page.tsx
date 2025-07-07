
import ProductPage from "@/components/app/ProductPage";
import { getProductsByCategoryName, getCategories } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch "Daily Essentials" products and the category list for a fast initial load.
  const [initialDailyEssentials, initialCategories] = await Promise.all([
    getProductsByCategoryName("Daily Essentials", 10),
    getCategories(),
  ]);
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return (
    <ProductPage 
      initialDailyEssentials={initialDailyEssentials}
      initialCategories={initialCategories}
    />
  );
}
