// Mock data has been removed. Every admin page now reads from the live API.

export function formatTaka(amount: number): string {
  return "৳ " + amount.toLocaleString("en-US");
}
