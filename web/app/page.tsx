import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="stack" style={{ gap: 20 }}>
      <section
        className="card"
        style={{
          background: "linear-gradient(135deg, #0F5F57, #1F8A7F)",
          color: "#fff",
          border: 0,
          padding: 24,
          display: "grid",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.9 }}>Eid campaign · test build</span>
        <h1 style={{ margin: 0, fontSize: 28, lineHeight: 1.2 }}>Shop from verified sellers across Bangladesh</h1>
        <div>
          <Link href="/products" className="btn btn-cta" style={{ marginTop: 8 }}>
            Shop now
          </Link>
        </div>
      </section>

      <section aria-labelledby="cats-h" className="stack">
        <h2 id="cats-h" style={{ margin: 0, fontSize: 18 }}>Categories</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <Link key={c} href={`/products?category=${encodeURIComponent(c)}`} className="btn btn-line">
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="trend-h" className="stack">
        <div className="row">
          <h2 id="trend-h" style={{ margin: 0, fontSize: 18 }}>Trending now</h2>
          <Link href="/products" style={{ color: "#0f5f57", fontWeight: 700 }}>
            See all
          </Link>
        </div>
        <div className="grid-products">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
