import { createHash } from "node:crypto";
import { getSql } from "@/lib/db";
import {
  DEFAULT_SHOP,
  DEFAULT_PRODUCTS,
  asProductCat,
  type Product,
  type ShopSettings,
} from "@/lib/catalog";

function useRemoteCatalog() {
  const url = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;
  if (url && url.trim()) return false;
  return Boolean(process.env.VERCEL) || Boolean(process.env.SUPABASE_URL);
}

const PIN_PREFIX = "dose-shop-pin:";

export function hashPin(pin: string) {
  return createHash("sha256").update(PIN_PREFIX + pin).digest("hex");
}

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

export async function fetchCatalog(): Promise<{
  products: Product[];
  shop: ShopSettings;
}> {
  if (useRemoteCatalog()) {
    const remote = await import("./dose.remote");
    return remote.fetchCatalog();
  }
  const sql = await getSql();
  await ensureCatalogRows(sql);
  const products = await sql<ProductRow>`
    select id, name, description, price, cat, photo, sort_order, stock
    from products
    order by sort_order asc, name asc
  `;
  const shops = await sql<ShopRow>`
    select name, tagline, whatsapp, phone, min_order, delivery_fee,
           address_line, city, hours, hours_note
    from shop_settings
    where id = 1
  `;
  return {
    products: products.map(asProduct),
    shop: shops[0] ? asShop(shops[0]) : DEFAULT_SHOP,
  };
}

let catalogEnsured = false;

async function ensureCatalogRows(
  sql: Awaited<ReturnType<typeof getSql>>,
) {
  if (catalogEnsured) return;
  const existing = await sql<{ id: string }>`select id from products`;
  const have = new Set(existing.map((r) => r.id));
  for (const [i, p] of DEFAULT_PRODUCTS.entries()) {
    if (have.has(p.id)) continue;
    await sql`
      insert into products (id, name, description, price, cat, photo, sort_order, stock)
      values (
        ${p.id}, ${p.name}, ${p.desc}, ${p.price},
        ${p.cat}, ${p.photo}, ${i}, ${p.stock}
      )
      on conflict (id) do nothing
    `;
  }
  await sql`
    update products
    set name = 'Coca-Cola',
        description = '330ml, κλασική',
        cat = 'drinks',
        photo = '/images/products/coca-cola.jpg'
    where id = 'cola' and cat = 'market'
  `;
  await sql`
    update products set name = 'Marlboro Red'
    where id = 'marl' and name = 'Marlboro'
  `;
  await sql`
    update products set name = 'Winston Classic'
    where id = 'winst' and name = 'Winston'
  `;
  await sql`
    update products set name = 'Davidoff Slim'
    where id = 'davi' and name = 'Davidoff'
  `;
  catalogEnsured = true;
}

export async function pinMatches(pin: string) {
  if (useRemoteCatalog()) {
    const remote = await import("./dose.remote");
    return remote.pinMatches(pin);
  }
  const sql = await getSql();
  const rows = await sql<{ pin_hash: string }>`
    select pin_hash from shop_settings where id = 1
  `;
  const hash = rows[0]?.pin_hash;
  if (!hash) return false;
  return hash === hashPin(pin);
}

export async function upsertProductRow(product: Product) {
  if (useRemoteCatalog()) {
    const remote = await import("./dose.remote");
    return remote.upsertProductRow(product);
  }
  const sql = await getSql();
  const existing = await sql<{ sort_order: number }>`
    select sort_order from products where id = ${product.id}
  `;
  let sort = existing[0]?.sort_order;
  if (sort === undefined) {
    const max = await sql<{ max: number | null }>`
      select max(sort_order) as max from products
    `;
    sort = Number(max[0]?.max ?? -1) + 1;
  }
  await sql`
    insert into products (id, name, description, price, cat, photo, sort_order, stock)
    values (
      ${product.id}, ${product.name}, ${product.desc}, ${product.price},
      ${product.cat}, ${product.photo}, ${sort}, ${Math.max(0, Math.round(product.stock))}
    )
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description,
      price = excluded.price,
      cat = excluded.cat,
      photo = excluded.photo,
      stock = excluded.stock
  `;
}

export async function deleteProductRow(id: string) {
  if (useRemoteCatalog()) {
    const remote = await import("./dose.remote");
    return remote.deleteProductRow(id);
  }
  const sql = await getSql();
  await sql`delete from products where id = ${id}`;
}

export async function updateShopRow(
  shop: ShopSettings,
  nextPin: string | undefined,
) {
  if (useRemoteCatalog()) {
    const remote = await import("./dose.remote");
    return remote.updateShopRow(shop, nextPin);
  }
  const sql = await getSql();
  if (nextPin && nextPin.trim()) {
    const pinHash = hashPin(nextPin.trim());
    await sql`
      update shop_settings set
        name = ${shop.name},
        tagline = ${shop.tagline},
        whatsapp = ${shop.whatsapp},
        phone = ${shop.phone},
        min_order = ${shop.minOrder},
        delivery_fee = ${shop.deliveryFee},
        address_line = ${shop.addressLine},
        city = ${shop.city},
        hours = ${shop.hours},
        hours_note = ${shop.hoursNote},
        pin_hash = ${pinHash}
      where id = 1
    `;
    return;
  }
  await sql`
    update shop_settings set
      name = ${shop.name},
      tagline = ${shop.tagline},
      whatsapp = ${shop.whatsapp},
      phone = ${shop.phone},
      min_order = ${shop.minOrder},
      delivery_fee = ${shop.deliveryFee},
      address_line = ${shop.addressLine},
      city = ${shop.city},
      hours = ${shop.hours},
      hours_note = ${shop.hoursNote}
    where id = 1
  `;
}
