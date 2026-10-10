import type { Metadata, Viewport } from "next";
import "./globals.css";
import SellerNav from "@/components/SellerNav";

export const metadata: Metadata = {
  title: "Bazaar BD Seller",
  description: "Seller dashboard. Test build with mock data.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <SellerNav />
          <main className="shell-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
