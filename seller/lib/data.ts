// Mock seller data for the test build. Replace with API calls when the backend exists.

export type SellerProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "Live" | "Pending review" | "Hidden" | "Rejected";
  sold: number;
};

export type SellerOrder = {
  id: string;
  placedAt: string;
  items: string;
  amount: number;
  area: string;
  payment: "bKash" | "Cash on delivery" | "Card";
  status: "New" | "Processing" | "Ready to ship" | "Shipped" | "Delivered" | "Cancellation requested";
};

export const sellerProducts: SellerProduct[] = [
  { id: "p1", name: "Handloom cotton saree, Indigo", price: 2450, stock: 14, status: "Live", sold: 120 },
  { id: "p2", name: "Jamdani scarf", price: 1150, stock: 8, status: "Live", sold: 64 },
  { id: "p3", name: "Block print cotton kurti", price: 1680, stock: 0, status: "Hidden", sold: 88 },
  { id: "p4", name: "Handwoven gamcha", price: 450, stock: 5, status: "Pending review", sold: 0 },
  { id: "p5", name: "Maroon saree (variant)", price: 2450, stock: 0, status: "Rejected", sold: 0 },
];

export const sellerOrders: SellerOrder[] = [
  { id: "NS-260410-1182A", placedAt: "10 Oct, 09:14", items: "Saree × 1", amount: 2450, area: "Dhanmondi, Dhaka", payment: "bKash", status: "Ready to ship" },
  { id: "NS-260410-1140", placedAt: "10 Oct, 07:50", items: "Saree × 2", amount: 4600, area: "Uttara, Dhaka", payment: "Cash on delivery", status: "Processing" },
  { id: "NS-260409-0877", placedAt: "9 Oct, 15:02", items: "Jamdani scarf × 1", amount: 1150, area: "Sylhet", payment: "Card", status: "Cancellation requested" },
  { id: "NS-260408-0412", placedAt: "8 Oct, 11:20", items: "Gamcha × 3", amount: 1350, area: "Chattogram", payment: "bKash", status: "New" },
];

export const sellerOrderSteps = ["Processing", "Ready to ship", "Shipped", "Delivered"] as const;

export const salesLast7 = [
  { day: "Mon", amount: 3200 },
  { day: "Tue", amount: 4100 },
  { day: "Wed", amount: 2600 },
  { day: "Thu", amount: 5300 },
  { day: "Fri", amount: 4700 },
  { day: "Sat", amount: 6100 },
  { day: "Sun", amount: 5400 },
];

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
