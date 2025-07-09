
import { getProductById, getSimilarProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import ProductDetails from "@/components/app/ProductDetails";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id as string;
  if (!productId) {
    notFound();
  }

  // Fetch the main product first
  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }
  
  // Then, fetch similar products based on the main product's category.
  // This is much more efficient than fetching all products.
  const similarProducts = await getSimilarProducts(product.category, product.id);

  return <ProductDetails product={product} similarProducts={similarProducts} />;
}
