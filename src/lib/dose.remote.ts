import {
  DEFAULT_PRODUCTS,
  DEFAULT_SHOP,
  asProductCat,
  type Product,
  type ShopSettings,
} from "@/lib/catalog";
import { createHash } from "node:crypto";

const PIN_PREFIX = "dose-shop-pin:";

function hashPin(pin: string) {
  return createHash("sha256").update(PIN_PREFIX + pin).digest("hex");
}

const SUPABASE_URL =
  (typeof process !== "undefined" && process.env.SUPABASE_URL?.trim()) ||
  "https://zesvvhuzvupdjxkqfamd.supabase.co";
const SUPABASE_KEY =
  (typeof process !== "undefined" && process.env.SUPABASE_ANON_KEY?.trim()) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplc3Z2aHV6dnVwZGp4a3FmYW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNDMzNzUsImV4cCI6MjEwMjYxOTM3NX0.y5uHawVHfsABmAvTk2E2bc7vUig22hVPo4Qnr7VHPBQ";

type ProductRow = {
  id: string;
  name: string;
  description: string;
  price: string | number;
  cat: string;
  photo: string;
  sort_order: number;
  stock: string | number;
};

type ShopRow = {
  name: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  min_order: string | number;
  delivery_fee: string | number;
  address_line: string;
  city: string;
  hours: string;
  hours_note: string;
  pin_hash?: string;
};

function asProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    desc: row.description,
    price: Number(row.price),
    cat: asProductCat(row.cat),
    photo: row.photo || "",
    stock: Math.max(0, Number(row.stock ?? 24)),
  };
}

function asShop(row: ShopRow): ShopSettings {
  return {
    name: row.name,
    tagline: row.tagline,
    whatsapp: row.whatsapp,
    phone: row.phone,
    minOrder: Number(row.min_order),
    deliveryFee: Number(row.delivery_fee),
    addressLine: row.address_line,
    city: row.city,
    hours: row.hours,
    hoursNote: row.hours_note,
  };
}

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Δεν αποθηκεύτηκε στον κατάλογο (${res.status}).`);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

async function ensureRemoteRows() {
  const existing = await rest<ProductRow[]>("dose_products?select=id");
  const have = new Set((existing ?? []).map((r) => r.id));
  const missing = DEFAULT_PRODUCTS.map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.desc,
    price: p.price,
    cat: p.cat,
    photo: p.photo,
    sort_order: i,
    stock: p.stock,
  })).filter((p) => !have.has(p.id));
  for (let i = 0; i < missing.length; i += 40) {
    const chunk = missing.slice(i, i + 40);
    await rest("dose_products", {
      method: "POST",
      headers: { Prefer: "return=minimal,resolution=ignore-duplicates" },
      body: JSON.stringify(chunk),
    });
  }
}

export async function fetchCatalog(): Promise<{
  products: Product[];
  shop: ShopSettings;
}> {
  await ensureRemoteRows();
  const products = await rest<ProductRow[]>(
    "dose_products?select=id,name,description,price,cat,photo,sort_order,stock&order=sort_order.asc,name.asc",
  );
  const shops = await rest<ShopRow[]>(
    "dose_shop_settings?id=eq.1&select=name,tagline,whatsapp,phone,min_order,delivery_fee,address_line,city,hours,hours_note,pin_hash",
  );
  return {
    products: (products ?? []).map(asProduct),
    shop: shops?.[0] ? asShop(shops[0]) : DEFAULT_SHOP,
  };
}

export async function pinMatches(pin: string) {
  const rows = await rest<Array<{ pin_hash: string }>>(
    "dose_shop_settings?id=eq.1&select=pin_hash",
  );
  const hash = rows?.[0]?.pin_hash;
  if (!hash) return false;
  return hash === hashPin(pin);
}

export async function upsertProductRow(product: Product) {
  const existing = await rest<Array<{ sort_order: number }>>(
    `dose_products?id=eq.${encodeURIComponent(product.id)}&select=sort_order`,
  );
  let sort = existing?.[0]?.sort_order;
  if (sort === undefined) {
    const maxRows = await rest<Array<{ sort_order: number }>>(
      "dose_products?select=sort_order&order=sort_order.desc&limit=1",
    );
    sort = Number(maxRows?.[0]?.sort_order ?? -1) + 1;
  }
  await rest("dose_products?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: product.id,
      name: product.name,
      description: product.desc,
      price: product.price,
      cat: product.cat,
      photo: product.photo,
      sort_order: sort,
      stock: Math.max(0, Math.round(product.stock)),
    }),
  });
}

export async function deleteProductRow(id: string) {
  await rest(`dose_products?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export async function updateShopRow(
  shop: ShopSettings,
  nextPin: string | undefined,
) {
  const patch: Record<string, unknown> = {
    name: shop.name,
    tagline: shop.tagline,
    whatsapp: shop.whatsapp,
    phone: shop.phone,
    min_order: shop.minOrder,
    delivery_fee: shop.deliveryFee,
    address_line: shop.addressLine,
    city: shop.city,
    hours: shop.hours,
    hours_note: shop.hoursNote,
  };
  if (nextPin?.trim()) patch.pin_hash = hashPin(nextPin.trim());
  await rest("dose_shop_settings?id=eq.1", {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
}
