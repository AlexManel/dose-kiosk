import { create } from "zustand";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SHOP,
  KEYS,
  cartCount,
  cartLines,
  cartTotals,
  type CartMap,
  type Order,
  type OrderStatus,
  type Product,
  type ShopSettings,
} from "./catalog";
import {
  removeProduct,
  saveProduct,
  saveShopSettings,
  verifyShopPin,
} from "./dose.functions";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type DoseState = {
  hydrated: boolean;
  products: Product[];
  shop: ShopSettings;
  cart: CartMap;
  orders: Order[];
  pin: string;
  authed: boolean;
  toast: string | null;
  cartOpen: boolean;
  hydrate: () => void;
  applyCatalog: (products: Product[], shop: ShopSettings) => void;
  setCartOpen: (open: boolean) => void;
  showToast: (msg: string) => void;
  addToCart: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  saveShop: (shop: Partial<ShopSettings>, nextPin?: string) => Promise<void>;
  addOrder: (order: Order) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  login: (code: string) => Promise<boolean>;
  logout: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let hydrating = false;

export const useDose = create<DoseState>((set, get) => ({
  hydrated: false,
  products: DEFAULT_PRODUCTS,
  shop: DEFAULT_SHOP,
  cart: {},
  orders: [],
  pin: "",
  authed: false,
  toast: null,
  cartOpen: false,

  hydrate: () => {
    if (get().hydrated || hydrating) return;
    hydrating = true;
    const cart = readJson<CartMap>(KEYS.cart, {});
    const orders = readJson<Order[]>(KEYS.orders, []);
    const pin =
      (typeof window !== "undefined" && sessionStorage.getItem(KEYS.sessionPin)) ||
      "";
    const authed = Boolean(pin);
    set({ cart, orders, pin, authed, hydrated: true });
    hydrating = false;
  },

  applyCatalog: (products, shop) => {
    const cart = { ...get().cart };
    let changed = false;
    for (const [id, qty] of Object.entries(cart)) {
      const stock = products.find((p) => p.id === id)?.stock ?? 0;
      if (qty > stock) {
        if (stock <= 0) delete cart[id];
        else cart[id] = stock;
        changed = true;
      }
    }
    if (changed) writeJson(KEYS.cart, cart);
    set({ products, shop, cart });
  },

  setCartOpen: (cartOpen) => set({ cartOpen, toast: cartOpen ? null : get().toast }),

  showToast: (msg) => {
    set({ toast: msg });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => set({ toast: null }), 1800);
  },

  addToCart: (id, qty = 1) => {
    const product = get().products.find((p) => p.id === id);
    const next = (get().cart[id] ?? 0) + qty;
    if (!product) return;
    if (product.stock <= 0) {
      get().showToast("Εξαντλήθηκε");
      return;
    }
    if (next > product.stock) {
      get().showToast(`Μένουν ${product.stock}`);
      return;
    }
    const cart = { ...get().cart, [id]: next };
    writeJson(KEYS.cart, cart);
    set({ cart });
    get().showToast("Προστέθηκε στο καλάθι");
  },

  setQty: (id, qty) => {
    const cart = { ...get().cart };
    const stock = get().products.find((p) => p.id === id)?.stock ?? 0;
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, stock);
    writeJson(KEYS.cart, cart);
    set({ cart });
  },

  clearCart: () => {
    writeJson(KEYS.cart, {});
    set({ cart: {} });
  },

  upsertProduct: async (product) => {
    const pin = get().pin;
    const catalog = await saveProduct({ data: { pin, product } });
    set({ products: catalog.products, shop: catalog.shop });
  },

  deleteProduct: async (id) => {
    const pin = get().pin;
    const catalog = await removeProduct({ data: { pin, id } });
    set({ products: catalog.products, shop: catalog.shop });
  },

  saveShop: async (partial, nextPin) => {
    const shop = { ...get().shop, ...partial };
    const pin = get().pin;
    const catalog = await saveShopSettings({
      data: { pin, shop, nextPin: nextPin?.trim() || undefined },
    });
    if (nextPin?.trim() && typeof window !== "undefined") {
      sessionStorage.setItem(KEYS.sessionPin, nextPin.trim());
      set({ pin: nextPin.trim() });
    }
    set({ products: catalog.products, shop: catalog.shop });
  },

  addOrder: (order) => {
    const orders = [order, ...get().orders];
    writeJson(KEYS.orders, orders);
    set({ orders });
  },

  setOrderStatus: (id, status) => {
    const orders = get().orders.map((o) => (o.id === id ? { ...o, status } : o));
    writeJson(KEYS.orders, orders);
    set({ orders });
  },

  login: async (code) => {
    const res = await verifyShopPin({ data: { pin: code } });
    if (!res.ok) return false;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(KEYS.sessionPin, code);
      sessionStorage.setItem(KEYS.auth, "1");
    }
    set({ authed: true, pin: code });
    return true;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(KEYS.sessionPin);
      sessionStorage.removeItem(KEYS.auth);
      localStorage.removeItem(KEYS.auth);
    }
    set({ authed: false, pin: "" });
  },
}));

export function useCartMeta() {
  const cart = useDose((s) => s.cart);
  const products = useDose((s) => s.products);
  const fee = useDose((s) => s.shop.deliveryFee);
  const items = cartLines(cart, products);
  const totals = cartTotals(items, fee);
  return { items, totals, count: cartCount(cart) };
}
