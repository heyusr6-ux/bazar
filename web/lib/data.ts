// Mock catalogue for the test build. Replace with API calls when the backend exists.

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

export const products: Product[] = [
  {
    slug: "handloom-cotton-saree-indigo",
    name: "Handloom cotton saree, Indigo",
    price: 2450,
    oldPrice: 2900,
    seller: "Nakshi Store",
    sellerVerified: true,
    rating: 4.8,
    reviews: 120,
    category: "Fashion",
    stock: 14,
    tone: "#D9E6F2",
    description: "Pure cotton handloom saree from Dhaka weavers, 5.5 m with blouse piece.",
  },
  {
    slug: "jamdani-scarf",
    name: "Jamdani scarf",
    price: 1150,
    seller: "Nakshi Store",
    sellerVerified: true,
    rating: 4.6,
    reviews: 64,
    category: "Fashion",
    stock: 8,
    tone: "#F2E6D9",
    description: "Hand-woven jamdani motifs on fine cotton. Light and breathable.",
  },
  {
    slug: "block-print-kurti",
    name: "Block print cotton kurti",
    price: 1680,
    seller: "Mirpur Mobile Hub",
    sellerVerified: true,
    rating: 4.7,
    reviews: 88,
    category: "Fashion",
    stock: 22,
    tone: "#E6F2D9",
    description: "Hand block-printed cotton kurti. Available in S to XL.",
  },
  {
    slug: "organic-honey-500g",
    name: "Organic honey, 500 g",
    price: 680,
    seller: "Sylhet Organics",
    sellerVerified: true,
    rating: 4.9,
    reviews: 41,
    category: "Grocery",
    stock: 3,
    tone: "#F7EDC9",
    description: "Raw wildflower honey from Sylhet hills, bottled in glass.",
  },
  {
    slug: "handwoven-gamcha",
    name: "Handwoven gamcha",
    price: 450,
    seller: "Nakshi Store",
    sellerVerified: true,
    rating: 4.5,
    reviews: 27,
    category: "Home",
    stock: 5,
    tone: "#E3E0F5",
    description: "Traditional handwoven gamcha, 100% cotton.",
  },
  {
    slug: "wireless-earbuds-basic",
    name: "Wireless earbuds (basic)",
    price: 1990,
    oldPrice: 2400,
    seller: "Mirpur Mobile Hub",
    sellerVerified: false,
    rating: 4.1,
    reviews: 203,
    category: "Electronics",
    stock: 40,
    tone: "#DDE6E4",
    description: "Bluetooth earbuds with charging case. 4 hours playback.",
  },
];

export const categories = ["Fashion", "Electronics", "Home", "Beauty", "Grocery"];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
