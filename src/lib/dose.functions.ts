import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SHOP,
  type Product,
  type ShopSettings,
} from "@/lib/catalog";
import type { ExpenseLine, PayKind, SaleChannel } from "@/lib/ledger";

const productSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(80),
  desc: z.string().max(200),
  price: z.number().min(0).max(999),
  cat: z.enum(["coffee", "bread", "drinks", "juice", "energy", "snacks", "market", "smokes", "heat"]),
  photo: z.string().max(700_000),
  stock: z.number().min(0).max(9999),
});

const shopSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().max(80),
  whatsapp: z.string().max(20),
  phone: z.string().max(20),
  minOrder: z.number().min(0).max(999),
  deliveryFee: z.number().min(0).max(999),
  addressLine: z.string().max(200),
  city: z.string().max(80),
  hours: z.string().max(80),
  hoursNote: z.string().max(80),
});

const saleItemSchema = z.object({
  id: z.string().min(1).max(64),
  qty: z.number().min(1).max(30),
});

const expenseLineSchema = z.object({
  name: z.string().min(1).max(120),
  qty: z.number().min(0.01).max(999),
  unitCost: z.number().min(0).max(9999),
  productId: z.string().max(64).nullable(),
});

async function requirePin(pin: string) {
  const { pinMatches } = await import("./dose.server");
  if (!(await pinMatches(pin))) {
    throw new Error("Λάθος κωδικός");
  }
}

export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { fetchCatalog } = await import("./dose.server");
    return await fetchCatalog();
  } catch (error) {
    console.error("[dose] catalog load failed", error);
    return { products: DEFAULT_PRODUCTS, shop: DEFAULT_SHOP };
  }
});

export const verifyShopPin = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    const { pinMatches } = await import("./dose.server");
    return { ok: await pinMatches(data.pin) };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80), product: productSchema }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { upsertProductRow, fetchCatalog } = await import("./dose.server");
    await upsertProductRow(data.product as Product);
    return fetchCatalog();
  });

export const removeProduct = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80), id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { deleteProductRow, fetchCatalog } = await import("./dose.server");
    await deleteProductRow(data.id);
    return fetchCatalog();
  });

export const saveShopSettings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      shop: shopSchema,
      nextPin: z.string().max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { updateShopRow, fetchCatalog } = await import("./dose.server");
    await updateShopRow(data.shop as ShopSettings, data.nextPin);
    return fetchCatalog();
  });

export const recordSale = createServerFn({ method: "POST" })
  .validator(
    z.object({
      items: z.array(saleItemSchema).min(1).max(20),
      channel: z.enum(["delivery", "walkin"]),
      pay: z.enum(["cash", "card"]),
      fee: z.number().min(0).max(999),
    }),
  )
  .handler(async ({ data }) => {
    const { insertSale } = await import("./ledger.server");
    const catalog = await insertSale({
      items: data.items,
      channel: data.channel as SaleChannel,
      pay: data.pay,
      fee: data.fee,
    });
    return catalog;
  });

export const recordWalkIn = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      items: z.array(saleItemSchema).min(1).max(20),
      pay: z.enum(["cash", "card"]),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { insertSale } = await import("./ledger.server");
    return insertSale({
      items: data.items,
      channel: "walkin",
      pay: data.pay,
      fee: 0,
    });
  });

export const getLedger = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { fetchLedger } = await import("./ledger.server");
    return fetchLedger();
  });

export const parseInvoice = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      image: z.string().max(900_000).optional().default(""),
      images: z.array(z.string().max(800_000)).max(4).optional(),
      text: z.string().max(20_000).optional().default(""),
      scanned: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const images = data.images?.filter(Boolean) ?? [];
    const image = data.image ?? "";
    if (image.length < 20 && images.length === 0 && (data.text?.trim().length ?? 0) < 8) {
      throw new Error("Δεν δόθηκε αρχείο");
    }
    const { readInvoice } = await import("./ledger.server");
    return readInvoice({
      image,
      images: images.length ? images : image ? [image] : [],
      text: data.text ?? "",
      scanned: data.scanned,
    });
  });

const expensePayload = z.object({
  pin: z.string().min(1).max(80),
  vendor: z.string().max(120),
  note: z.string().max(200),
  photo: z.string().max(900_000),
  invoiceNo: z.string().max(40),
  invoiceDate: z.string().max(20),
  restock: z.boolean(),
  pay: z.enum(["cash", "card", "transfer"]),
  items: z.array(expenseLineSchema).min(1).max(40),
});

export const saveExpense = createServerFn({ method: "POST" })
  .validator(expensePayload)
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { insertExpense } = await import("./ledger.server");
    return insertExpense({
      vendor: data.vendor,
      note: data.note,
      photo: data.photo,
      invoiceNo: data.invoiceNo,
      invoiceDate: data.invoiceDate,
      restock: data.restock,
      pay: data.pay as PayKind,
      items: data.items as ExpenseLine[],
    });
  });

export const editExpense = createServerFn({ method: "POST" })
  .validator(expensePayload.extend({ id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { updateExpense } = await import("./ledger.server");
    return updateExpense({
      id: data.id,
      vendor: data.vendor,
      note: data.note,
      photo: data.photo,
      invoiceNo: data.invoiceNo,
      invoiceDate: data.invoiceDate,
      restock: data.restock,
      pay: data.pay as PayKind,
      items: data.items as ExpenseLine[],
    });
  });

export const removeExpense = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80), id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { deleteExpense } = await import("./ledger.server");
    return deleteExpense(data.id);
  });

export const removeSale = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80), id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const { deleteSale } = await import("./ledger.server");
    return deleteSale(data.id);
  });

const moneyOpt = z.union([z.number().min(0).max(99999), z.null()]);

export const openTill = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      openFloat: z.number().min(0).max(99999),
      note: z.string().max(120).optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const till = await import("./ledger.server");
    return till.openTill({ openFloat: data.openFloat, note: data.note ?? "" });
  });

export const closeTill = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      countedCash: z.number().min(0).max(99999),
      note: z.string().max(120).optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const till = await import("./ledger.server");
    return till.closeTill({ countedCash: data.countedCash, note: data.note ?? "" });
  });

export const addTillMove = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      kind: z.enum(["in", "out"]),
      amount: z.number().min(0.01).max(99999),
      reason: z.string().max(80),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const till = await import("./ledger.server");
    return till.addTillMove({
      kind: data.kind,
      amount: data.amount,
      reason: data.reason,
    });
  });

export const removeTillMove = createServerFn({ method: "POST" })
  .validator(z.object({ pin: z.string().min(1).max(80), id: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const till = await import("./ledger.server");
    return till.deleteTillMove(data.id);
  });

export const parseZReport = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      kind: z.enum(["z", "pos"]),
      image: z.string().max(900_000).optional().default(""),
      images: z.array(z.string().max(800_000)).max(3).optional(),
      text: z.string().max(12_000).optional().default(""),
      scanned: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const images = data.images?.filter(Boolean) ?? [];
    const image = data.image ?? "";
    if (image.length < 20 && images.length === 0 && (data.text?.trim().length ?? 0) < 8) {
      throw new Error("Δεν δόθηκε αρχείο");
    }
    const { readZReport } = await import("./ledger.server");
    return readZReport({
      image,
      images: images.length ? images : image ? [image] : [],
      text: data.text ?? "",
      scanned: data.scanned,
      kind: data.kind,
    });
  });

export const saveTillCheck = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().min(1).max(80),
      zCash: moneyOpt,
      zCard: moneyOpt,
      posCard: moneyOpt,
      note: z.string().max(120).optional().default(""),
      zPhoto: z.string().max(900_000).optional().default(""),
      posPhoto: z.string().max(900_000).optional().default(""),
    }),
  )
  .handler(async ({ data }) => {
    await requirePin(data.pin);
    const till = await import("./ledger.server");
    return till.saveTillCheck({
      zCash: data.zCash,
      zCard: data.zCard,
      posCard: data.posCard,
      note: data.note ?? "",
      zPhoto: data.zPhoto ?? "",
      posPhoto: data.posPhoto ?? "",
    });
  });
