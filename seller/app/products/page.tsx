import Link from "next/link";
import { formatTaka, sellerProducts, SellerProduct } from "@/lib/data";

const statusClass: Record<SellerProduct["status"], string> = {
  Live: "pill pill-ok",
  "Pending review": "pill pill-warn",
  Hidden: "pill pill-info",
  Rejected: "pill pill-danger",
};

export default function ProductsPage() {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <header className="page-head">
        <h1>Products</h1>
        <Link href="/products/new" className="btn">Add product</Link>
      </header>

      <div className="table-box">
        <table>
          <caption className="sr-only">Your products</caption>
          <thead>
            <tr><th>Product</th><th>Price</th><th>Stock</th><th>Sold</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {sellerProducts.map((p) => (
              <tr key={p.id}>
                <td><b>{p.name}</b></td>
                <td>{formatTaka(p.price)}</td>
                <td>{p.stock === 0 ? <span className="pill pill-danger">0 (hidden)</span> : p.stock}</td>
                <td>{p.sold}</td>
                <td><span className={statusClass[p.status]}>{p.status}</span></td>
                <td><button type="button" className="btn btn-line btn-sm">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ fontSize: 13, margin: 0 }}>
        Products with 0 stock are hidden from buyers. Rejected items show the admin reason in the edit screen.
      </p>
    </div>
  );
}
