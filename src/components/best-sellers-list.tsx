import HorizontalRow from "@/components/horizontal-row";
import ProductCard from "@/components/product-card";
import type { Product } from "@/lib/api";

interface BestSellersListProps { products: Product[]; }

export default function BestSellersList({ products }: BestSellersListProps) {
  return (
    <HorizontalRow title="Best Sellers" viewAllHref="/products?collection=best-sellers">
      {products.map((product) => <ProductCard key={product.id} product={product} compact />)}
    </HorizontalRow>
  );
}
