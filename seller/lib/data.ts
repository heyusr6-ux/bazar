// Mock data has been removed. Seller pages read from the live API.

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
