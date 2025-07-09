
import { getProductById, getProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/app/ProductDetails";
import type { Product } from "@/types";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id as string;
  if (!productId) {
    notFound();
  }

  // Fetch in parallel
  const [product, allProducts] = await Promise.all([
    getProductById(productId),
    getProducts(),
  ]);

  if (!product) {
    notFound();
  }
  
  const similarProducts = allProducts
    .filter((p: Product) => p.category === product.category && p.id !== product.id)
    .slice(0, 6);

  return <ProductDetails product={product} similarProducts={similarProducts} />;
}
