
import ProductPage from "@/components/app/ProductPage";
import { getNewestProducts } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Pre-fetch only the newest products for the initial, fast load.
  const newestProducts = await getNewestProducts(10);
  
  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return <ProductPage initialNewestProducts={newestProducts} />;
}
