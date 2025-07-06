
import ProductPage from "@/components/app/ProductPage";
import { getRecommendedProducts } from "@/lib/data";

// This is an async Server Component
export default async function Home() {
  // Fetch only the essential, "above the fold" data on the server. This is fast.
  const recommendedProducts = await getRecommendedProducts();

  // Pass the server-fetched data as initial props to the client component.
  // The client component will handle fetching the rest of the data.
  return <ProductPage initialRecommendedProducts={recommendedProducts} />;
}
