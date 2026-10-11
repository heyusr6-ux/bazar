import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { formatTaka } from "@/lib/data";
import { loadProduct, loadProducts } from "@/lib/catalog";

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await loadProduct(params.slug);
  if (!product) notFound();
  const products = await loadProducts();

  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  const outOfStock = product.stock === 0;

  return (
    <div className="stack" style={{ gap: 20 }}>
      <nav className="muted" aria-label="Breadcrumb" style={{ fontSize: 13 }}>
        <Link href="/products">Shop</Link> › {product.category} › {product.name}
      </nav>

      <div className="layout-two">
        <div className="card">
          <div className="product-thumb" style={{ background: product.tone, aspectRatio: "1 / 1", fontSize: 14 }} aria-label={`${product.name} image placeholder`}>
            Product image
          </div>
        </div>

        <div className="stack">
          <h1 style={{ margin: 0, fontSize: 22 }}>{product.name}</h1>
          {product.reviews > 0 && <span className="muted">★ {product.rating} · {product.reviews} reviews</span>}
          <div className="row" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <span className="price" style={{ fontSize: 24 }}>{formatTaka(product.price)}</span>
            {product.oldPrice && <span className="price-old">{formatTaka(product.oldPrice)}</span>}
          </div>

          <div className="card stack" style={{ padding: 12 }}>
            <div className="row">
              <span>Sold by</span>
              <b>
                {product.seller}{" "}
                {product.sellerVerified ? <span className="pill pill-ok">Verified</span> : null}
              </b>
            </div>
            <div className="row">
              <span>Delivery</span>
              <span className="muted">Dhaka 1–3 days · other areas 3–7 days</span>
            </div>
            <div className="row">
              <span>Stock</span>
              <span className={product.stock <= 5 ? "pill pill-warn" : "muted"}>
                {outOfStock ? "Out of stock" : product.stock <= 5 ? `Only ${product.stock} left` : "In stock"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <AddToCartButton slug={product.slug} disabled={outOfStock} />
            <Link href="/checkout" className="btn btn-cta" aria-disabled={outOfStock}>
              Buy now
            </Link>
          </div>

          <div className="notice">শুধু ক্যাশ অন ডেলিভারি। পণ্য হাতে পেয়ে টাকা দিন।</div>

          <div className="stack">
            <b>About this product</b>
            <p className="muted" style={{ margin: 0 }}>{product.description}</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="stack" aria-labelledby="rel-h">
          <h2 id="rel-h" style={{ margin: 0, fontSize: 18 }}>Related products</h2>
          <div className="grid-products">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
