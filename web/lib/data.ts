// Shared product type and money formatting. Products come from the live API (see lib/catalog.ts).

export type Product = {
  slug: string;
  name: string;
  price: number; // BDT
  oldPrice?: number;
  seller: string;
  sellerVerified: boolean;
  rating: number;
  reviews: number;
  category: string;
  stock: number;
  tone: string; // placeholder image colour
  description: string;
  images?: string[]; // photo URLs from the API
};

// Categories the API accepts for listings.
export const categories = ["Fashion", "Electronics", "Home", "Beauty", "Grocery"];

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
