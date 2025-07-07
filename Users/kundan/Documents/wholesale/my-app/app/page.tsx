
import ProductPage from "@/components/app/ProductPage";

// The homepage now solely relies on the client-rendered ProductPage.
// All data fetching and logic is handled within that component.
export default function Home() {
  return <ProductPage />;
}
