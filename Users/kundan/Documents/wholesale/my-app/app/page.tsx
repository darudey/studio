
import ProductPage from "@/components/app/ProductPage";
import { getProductsByCategoryName } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch only the "Daily Essentials" products for the initial, fast load.
  // This query is now fast because of the composite index on (category, createdAt).
  const initialDailyEssentials = await getProductsByCategoryName("Daily Essentials", 10);
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return <ProductPage initialDailyEssentials={initialDailyEssentials} />;
}
