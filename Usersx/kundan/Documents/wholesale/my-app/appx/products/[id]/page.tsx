
import { getProductById, getSimilarProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import ProductDetailsClient from "@/components/app/ProductDetailsClient";
import type { Product } from "@/types";

// This is the new Server Component. It fetches data on the server for a fast initial load.
export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id;
  
  // Fetch required data on the server. This is much faster for LCP.
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }
  
  // Fetch similar products on the server as well.
  const similarProducts = await getSimilarProducts(product.category, product.id);

  // Pass the server-fetched data as props to the Client Component, which handles interactivity.
  return <ProductDetailsClient product={product} similarProducts={similarProducts} />;
}
