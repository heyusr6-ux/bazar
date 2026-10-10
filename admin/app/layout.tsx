import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdminNav from "@/components/AdminNav";

export const metadata: Metadata = {
  title: "Bazaar BD Admin",
  description: "Admin panel. Test build with mock data.",
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
          <AdminNav />
          <main className="shell-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
