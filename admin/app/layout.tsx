import type { Metadata, Viewport } from "next";
import "./globals.css";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Bazaar BD Admin",
  description: "Admin panel.",
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
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
