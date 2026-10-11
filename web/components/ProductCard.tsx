import Link from "next/link";
import { formatTaka, Product } from "@/lib/data";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="card product-card" aria-label={product.name}>
      <div className="product-thumb" style={{ background: product.tone }} aria-hidden="true">
        {product.category}
      </div>
      <b style={{ fontSize: 14 }}>{product.name}</b>
      <div className="row" style={{ justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <span className="price">{formatTaka(product.price)}</span>
        {product.oldPrice && <span className="price-old">{formatTaka(product.oldPrice)}</span>}
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        {product.reviews > 0 ? `★ ${product.rating} (${product.reviews}) · ` : ""}{product.seller}
      </span>
      {product.stock <= 5 && <span className="pill pill-warn" style={{ justifySelf: "start" }}>Low stock</span>}
    </Link>
  );
}
