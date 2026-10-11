import type { Metadata, Viewport } from "next";
import "./globals.css";
import SellerShell from "@/components/SellerShell";

export const metadata: Metadata = {
  title: "Bazaar BD Seller",
  description: "Seller dashboard for Bazaar BD.",
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
        <SellerShell>{children}</SellerShell>
      </body>
    </html>
  );
}
