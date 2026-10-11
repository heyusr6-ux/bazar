// Cart kept in the browser (localStorage).
// Every access is wrapped in try/catch because storage can be blocked or unavailable.

export type CartItem = { slug: string; qty: number };

const KEY = "bazaar-cart";
const EVENT = "bazaar-cart-change";

export function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // storage unavailable: cart works for this page view only
  }
  window.dispatchEvent(new Event(EVENT));
}

export function addToCart(slug: string, qty = 1) {
  const items = readCart();
  const hit = items.find((i) => i.slug === slug);
  if (hit) hit.qty += qty;
  else items.push({ slug, qty });
  writeCart(items);
}

export function setQty(slug: string, qty: number) {
  const items = readCart()
    .map((i) => (i.slug === slug ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  writeCart(items);
}

export function removeFromCart(slug: string) {
  writeCart(readCart().filter((i) => i.slug !== slug));
}

export function subscribeCart(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
