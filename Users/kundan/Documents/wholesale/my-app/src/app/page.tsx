
import ProductPage from "@/components/app/ProductPage";
import { getProductsByCategoryName } from "@/lib/data";

// This is now a server component. It pre-fetches data for speed.
export default async function Home() {
  // Pre-fetch only the "Daily Essentials" products on the server.
  // This is much faster and more reliable for the user's initial view.
  const dailyEssentials = await getProductsByCategoryName("Daily Essentials", 20);
  
  // Pass the server-fetched data as a prop to the client-side ProductPage component.
  return <ProductPage initialDailyEssentials={dailyEssentials} />;
}
