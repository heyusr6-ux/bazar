import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/lib/data";

type SearchParams = { q?: string; category?: string; sort?: string };

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const category = searchParams.category ?? "";
  const sort = searchParams.sort ?? "";

  let list = products.filter(
    (p) =>
      (!q || p.name.toLowerCase().includes(q) || p.seller.toLowerCase().includes(q)) &&
      (!category || p.category === category),
  );

  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);

  return (
    <div className="layout-products">
      <aside className="card stack filters" aria-label="Filters">
        <b>Category</b>
        <a href="/products" className={category ? "muted" : ""}>All</a>
        {categories.map((c) => (
          <a key={c} href={`/products?category=${encodeURIComponent(c)}`} className={category === c ? "" : "muted"}>
            {c}
          </a>
        ))}
      </aside>

      <section className="stack" aria-label="Product list">
        <div className="row">
          <p className="muted" style={{ margin: 0 }}>
            {list.length} products{q ? ` for "${searchParams.q}"` : ""}
          </p>
          <form method="get" action="/products" style={{ display: "flex", gap: 8 }}>
            {q && <input type="hidden" name="q" value={searchParams.q} />}
            {category && <input type="hidden" name="category" value={category} />}
            <select name="sort" defaultValue={sort} aria-label="Sort" style={{ minHeight: 44, borderRadius: 10, padding: "0 10px" }}>
              <option value="">Relevance</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
            <button type="submit" className="btn btn-line">Apply</button>
          </form>
        </div>

        {list.length === 0 ? (
          <div className="card stack">
            <b>No products match your search</b>
            <span className="muted">Try a different word or clear the filters.</span>
            <a href="/products" className="btn" style={{ justifySelf: "start" }}>Clear filters</a>
          </div>
        ) : (
          <div className="grid-products">
            {list.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
