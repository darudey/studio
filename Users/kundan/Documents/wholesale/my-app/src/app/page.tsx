import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts } from "@/lib/data";

// This is a Server Component. It fetches only the essential data on the server.
export default async function Home() {
  // Fetch only the "Recommended" products. This is a fast, indexed query.
  const recommendedProducts = await getRecommendedProducts();

  // Pass this initial data to the client component. The rest of the data
  // will be fetched on the client side after this initial view has loaded.
  return <ProductPage initialRecommended={recommendedProducts} />;
}
