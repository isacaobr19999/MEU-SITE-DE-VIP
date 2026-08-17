export type StoreProduct = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  kind: "VIP" | "COINS" | "KIT" | "COSMETIC";
  imageUrl: string | null;
  priceCents: number;
  durationDays: number | null;
  featured: boolean;
  categoryName: string;
  categorySlug: string;
};

export type CartItem = StoreProduct & { serverId: number; serverName: string; quantity: number };

const CART_STORAGE_KEY = "playstorcraft:cart:v1";

export function readCart(): CartItem[] {
  try {
    const content = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = content ? JSON.parse(content) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "object" && item !== null) as CartItem[] : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addCartItem(items: CartItem[], product: StoreProduct, serverId: number, serverName: string) {
  const existing = items.find(item => item.id === product.id && item.serverId === serverId);
  if (existing) return items.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
  return [...items, { ...product, serverId, serverName, quantity: 1 }];
}

/** Remove itens persistidos que não pertencem mais ao catálogo público ativo. */
export function removeUnavailableCartItems(items: CartItem[], availableProducts: Pick<StoreProduct, "id">[]) {
  const availableIds = new Set(availableProducts.map(product => product.id));
  return items.filter(item => availableIds.has(item.id));
}
