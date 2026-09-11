export const CATS = [
  "all",
  "coffee",
  "bread",
  "drinks",
  "juice",
  "energy",
  "snacks",
  "market",
  "smokes",
  "heat",
] as const;
export type CatFilter = (typeof CATS)[number];
export type ProductCat = Exclude<CatFilter, "all">;

export const CAT_LABEL: Record<CatFilter, string> = {
  all: "Όλα",
  coffee: "Καφέδες",
  bread: "Ψωμιά",
  drinks: "Αναψυκτικά",
  juice: "Χυμοί",
  energy: "Energy",
  snacks: "Σνακ",
  market: "Ψιλικά",
  smokes: "Τσιγάρα",
  heat: "Ατμίσματα",
};

const PRODUCT_CATS: ProductCat[] = [
  "coffee",
  "bread",
  "drinks",
  "juice",
  "energy",
  "snacks",
  "market",
  "smokes",
  "heat",
];

export function asProductCat(v: unknown): ProductCat {
  if (typeof v === "string" && (PRODUCT_CATS as string[]).includes(v)) {
    return v as ProductCat;
  }
  return "market";
}

export function foldText(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ς/g, "σ")
    .toLowerCase();
}

export function matchesQuery(product: Product, q: string) {
  const raw = q.trim();
  if (!raw) return true;
  let needle = foldText(raw)
    .replace(/\bterrea\b/g, "terea")
    .replace(/\biqos\b/g, "terea")
    .replace(/\biluma\b/g, "terea")
    .replace(/\bfrape\b/g, "frappe")
    .replace(/\bφραπε\b/g, "frappe")
    .replace(/\binprime\b/g, "veev prime")
    .replace(/\bin prime\b/g, "veev prime")
    .replace(/\bploom\b/g, "evo")
    .replace(/\bκοκα\b/g, "coca")
    .replace(/\bκολα\b/g, "coca cola");
  const hay = foldText(
    `${product.name} ${product.desc} ${CAT_LABEL[product.cat]} ${hints(product)}`,
  );
  return needle
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

function hints(p: Product) {
  if (p.id.startsWith("ter")) return "iqos terea terrea iluma θερμαινομενος";
  if (p.id.startsWith("del")) return "delia ντελια iqos ραβδοι θερμαινομενος";
  if (p.id.startsWith("evo")) return "ploom evo θερμαινομενος";
  if (p.id.startsWith("neo")) return "glo neo θερμαινομενος hyper";
  if (p.id.startsWith("veo")) return "glo veo click twist hyper ροοιμπος";
  if (p.id.startsWith("vir")) return "glo virto hilo καπνος θερμαινομενος";
  if (p.id.startsWith("riv")) return "glo rivo hilo click twist";
  if (p.id.startsWith("iluma") || p.id.startsWith("glo-"))
    return "συσκευη iqos iluma glo hyper hilo x2 prime mid";
  if (p.id.startsWith("winst")) return "winston ουινστον τσιγαρα πακετο 100s greece legend";
  if (p.id.startsWith("v1")) return "veev one ατμισμα pod";
  if (p.id.startsWith("vp")) return "veev prime inprime ατμισμα pod";
  if (p.id.startsWith("cola")) return "κολα coca cola αναψυκτικο zero light";
  if (p.id.startsWith("xixo")) {
    const extra: Record<string, string> = {
      "xixo-p": "ροδακινο peach ice tea",
      "xixo-pz": "ροδακινο peach zero",
      "xixo-l": "λεμονι lemon ice tea",
      "xixo-s": "φραουλα strawberry ice tea",
      "xixo-rb": "βατομουρο blueberry raspberry",
      "xixo-gt": "πρασινο green tea zero",
      "xixo-t": "tutti frutti φρουτα",
      "xixo-bc": "κερασι cherry black",
      "xixo-ap": "μηλο apple tutti",
      "xixo-kw": "ακιουι kiwi tutti",
      "xixo-pl": "pink lemonade φραουλα λαιμ",
      "xixo-mo": "mojito μοχιτο μεντα λαιμ",
    };
    return `xixo xixο ξιξο ${extra[p.id] ?? ""}`;
  }
  if (p.id.startsWith("trid")) return "trident τσιχλες μαστιχες δυοσμος μεντα φραουλα καρπουζι";
  if (p.id === "amita-b") return "frulite boost φρουλαϊτ πορτοκαλι νεκταρινι";
  if (p.id.startsWith("amita")) return "χυμος amita αμιτα motion";
  if (p.id.startsWith("rb")) {
    const extra: Record<string, string> = {
      rbsf: "sugarfree χωρις ζαχαρη",
      rbz: "zero χωρις ζαχαρη",
      "rb-pe": "peach ροδακινο white peach",
      "rb-wm": "watermelon καρπουζι red edition",
      "rb-su": "summer grapefruit γκρεϊπφρουτ",
      "rb-ch": "cherry κερασι blossom",
    };
    return `redbull red bull ενεργειακο ${extra[p.id] ?? ""}`;
  }
  if (p.id.startsWith("hell")) {
    const extra: Record<string, string> = {
      "hell-ct": "κακτος cactus carnival καρναβαλι",
      "hell-cc": "μαλλι cotton carnival ζαχαρωτο καρναβαλι",
      "hell-foc": "focus φοκους",
      "hell-mul": "multi πολυβιταμινες",
      "hell-rg": "σταφυλι grape redgrape",
      "hell-wm": "καρπουζι watermelon",
      "hell-sf": "focus φοκους strong",
      "hell-zb": "berry βατομουρο zero",
      "hell-zp": "ροδακινο peach zero",
      "hell-lg": "λεμονι γκρεϊπφρουτ grapefruit",
      "hell-mp": "πεπονι φραγκόσυκο melon prickly",
      "hell-sb": "φραουλα μπανανα strawberry banana",
      "hell-bc": "κερασι cherry",
      "hell-ap": "μηλο apple",
      "hell-pl": "ροδακινο λεμονι peach lemon",
      hellz: "classic zero",
    };
    return `hell ενεργειακο χελ ${extra[p.id] ?? ""}`;
  }
  if (p.id.startsWith("sch")) return "schweppes swepps σγουεπς";
  if (p.id.startsWith("fru")) return "frulite φρουλαϊτ χυμος φρουτοποτο";
  if (p.id.startsWith("mon")) return "monster energy μονστερ";
  if (p.id.startsWith("bang")) return "bang energy";
  if (p.id.startsWith("pow")) return "powerade ισοτονικο";
  if (p.id.startsWith("blk")) return "fuze tea φουζ τσι ice tea παγος";
  if (p.id === "wat" || p.id.startsWith("vikos")) return "βικος vikos νερο μεταλλικο σοδοκολα βυσσιναδα";
  if (p.id.startsWith("ion")) return "ιον ion σοκολατα σοκοφρετα break 3bit αμυγδαλου derby";
  if (p.id.startsWith("kbuen") || p.id === "kdel") return "kinder bueno κιντερ γκοφρετα";
  if (p.id === "kitkat") return "kitkat kit kat νεστλε σοκολατα";
  if (p.id === "lacta") return "lacta λακτα σοκολατα";
  if (p.id === "snick") return "snickers σνικερς σοκολατα";
  if (p.id === "mars") return "mars μαρς σοκολατα";
  if (p.id === "twix") return "twix τουιξ σοκολατα";
  if (p.id === "bounty") return "bounty μπαουντι καρυδα σοκολατα";
  if (p.id === "ft") return "full throttle energy";
  if (p.id.startsWith("fanta")) return "fanta φαντα πορτοκαλι λεμονι";
  if (p.id.startsWith("sprite")) return "sprite σπραϊτ";
  if (p.id.startsWith("tsak")) return "tsakiris τσακιρης chips πατατακια κυματιστα sticks σνακ";
  if (p.id.startsWith("chee") || p.id.startsWith("extra") || p.id.startsWith("tasty"))
    return "γαριδακια πακοτινια δρακουλινα φουντουνια cheetos tasty extra σνακ";
}

export const FEATURED_IDS = ["fe", "fc", "frap", "cap", "marl", "winst", "davi"] as const;

export type Product = {
  id: string;
  name: string;
  desc: string;
  price: number;
  cat: ProductCat;
  photo: string;
  stock: number;
};

export type ShopSettings = {
  name: string;
  tagline: string;
  whatsapp: string;
  phone: string;
  minOrder: number;
  deliveryFee: number;
  addressLine: string;
  city: string;
  hours: string;
  hoursNote: string;
};

export type CartMap = Record<string, number>;

export type PayMethod = "cash" | "card";

export type OrderData = {
  name: string;
  phone: string;
  address: string;
  floor: string;
  notes: string;
  pay: PayMethod;
};

export type OrderItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type OrderStatus = "νέα" | "έγινε" | "ακυρώθηκε";

export type Order = {
  id: string;
  at: string;
  status: OrderStatus;
  items: OrderItem[];
  data: OrderData;
  totals: { sub: number; fee: number; grand: number };
};

export const KEYS = {
  menu: "dose-menu",
  shop: "dose-shop",
  cart: "dose-cart",
  orders: "dose-orders",
  pin: "dose-pin",
  auth: "dose-auth",
  sessionPin: "dose-session-pin",
} as const;

export const DEFAULT_PIN = "dose";

export const DEFAULT_SHOP: ShopSettings = {
  name: "Dose",
  tagline: "Coffee & More",
  whatsapp: "306900000000",
  phone: "6900000000",
  minOrder: 5,
  deliveryFee: 1.5,
  addressLine: "Γωνιακό κατάστημα, πεζόδρομος & φανάρι",
  city: "Θεσσαλονίκη",
  hours: "07:00 – 22:00",
  hoursNote: "Καθημερινά",
};

const img = (file: string) => `/images/products/${file}?v=19`;

const BASE_MENU: Omit<Product, "stock">[] = [
  { id: "esp", name: "Espresso", desc: "Μονός, κοντός, με κρέμα", price: 1.8, cat: "coffee", photo: "/images/espresso.jpg" },
  { id: "espd", name: "Espresso διπλός", desc: "Όταν η μέρα το απαιτεί", price: 2.3, cat: "coffee", photo: img("espresso-double.jpg") },
  { id: "cap", name: "Cappuccino", desc: "Γάλα, μικροαφρός", price: 2.5, cat: "coffee", photo: img("cappuccino.jpg") },
  { id: "fe", name: "Freddo espresso", desc: "Κρύος, σφιχτός", price: 2.4, cat: "coffee", photo: "/images/freddo.jpg" },
  { id: "fc", name: "Freddo cappuccino", desc: "Με αφρόγαλα", price: 2.8, cat: "coffee", photo: img("freddo-cap.jpg") },
  { id: "frap", name: "Frappe", desc: "Κρύος, χτυπημένος", price: 2.3, cat: "coffee", photo: img("frappe.jpg") },
  { id: "el", name: "Ελληνικός", desc: "Μεζές της υπομονής", price: 1.8, cat: "coffee", photo: img("ellinikos.jpg") },
  { id: "fil", name: "Φίλτρου", desc: "Καθαρός, αργός", price: 2.2, cat: "coffee", photo: img("filter.jpg") },
  { id: "lat", name: "Latte", desc: "Πιο γάλα, πιο μαλακός", price: 3.0, cat: "coffee", photo: img("latte.jpg") },

  { id: "koul", name: "Κουλούρι Θεσσαλονίκης", desc: "Σουσάμι, ζεστό αν προλάβεις", price: 0.8, cat: "bread", photo: "/images/bread.jpg" },
  { id: "loaf", name: "Σταρένιο καρβέλι", desc: "Της ημέρας", price: 2.5, cat: "bread", photo: img("loaf.jpg") },
  { id: "seed", name: "Πολύσπορο", desc: "Για το βράδυ στο σπίτι", price: 2.8, cat: "bread", photo: img("seeded.jpg") },
  { id: "cro", name: "Croissant", desc: "Απλό, σωστό", price: 1.8, cat: "bread", photo: img("croissant.jpg") },
  { id: "tyr", name: "Τυρόπιτα", desc: "Φύλλο, φέτα", price: 2.2, cat: "bread", photo: img("tyropita.jpg") },
  { id: "spa", name: "Σπανακόπιτα", desc: "Χόρτα, άνηθος", price: 2.2, cat: "bread", photo: img("spanakopita.jpg") },

  { id: "cola", name: "Coca-Cola", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("coca-cola.jpg") },
  { id: "colaz", name: "Coca-Cola Zero", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("coca-cola-zero.jpg") },
  { id: "cola-lem", name: "Coca-Cola Lemon", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.5, cat: "drinks", photo: img("coca-cola-lemon.jpg") },
  { id: "cola-lt", name: "Coca-Cola Light", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("coca-cola-light.jpg") },
  { id: "cola-zcaf", name: "Coca-Cola Zero Caffeine", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("coca-cola-zero-caffeine.jpg") },
  { id: "fanta", name: "Fanta Πορτοκαλάδα", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("fanta-portokali.jpg") },
  { id: "fantal", name: "Fanta Λεμονάδα", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("fanta-lemonada.jpg") },
  { id: "fanta-ex", name: "Fanta Exotic Zero", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.5, cat: "drinks", photo: img("fanta-exotic.jpg") },
  { id: "fanta-bl", name: "Fanta Μπλε", desc: "330ml κουτάκι, χωρίς ανθρακικό", price: 1.5, cat: "drinks", photo: img("fanta-blue.jpg") },
  { id: "fanta-z", name: "Fanta Πορτοκαλάδα Zero", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.5, cat: "drinks", photo: img("fanta-zero.jpg") },
  { id: "sprite", name: "Sprite", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("sprite.jpg") },
  { id: "spritez", name: "Sprite Zero", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.5, cat: "drinks", photo: img("sprite-zero.jpg") },
  { id: "vikos-cola", name: "Βίκος Cola", desc: "330ml", price: 1.2, cat: "drinks", photo: img("vikos-cola.jpg") },
  { id: "vikos-cz", name: "Βίκος Cola Zero", desc: "330ml, χωρίς ζάχαρη", price: 1.2, cat: "drinks", photo: img("vikos-colaz.jpg") },
  { id: "vikos-pg", name: "Βίκος Pink Grapefruit", desc: "330ml", price: 1.2, cat: "drinks", photo: img("vikos-pg.jpg") },
  { id: "vikos-vys", name: "Βίκος Βυσσινάδα", desc: "330ml", price: 1.2, cat: "drinks", photo: img("vikos-vys.jpg") },
  { id: "vikos-soda", name: "Βίκος Soda Water", desc: "330ml", price: 1.0, cat: "drinks", photo: img("vikos-soda.jpg") },
  { id: "sch-ton", name: "Schweppes Indian Tonic", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-tonic.jpg") },
  { id: "sch-gf", name: "Schweppes Pink Grapefruit", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-grapefruit.jpg") },
  { id: "sch-soda", name: "Schweppes Soda Water", desc: "330ml κουτάκι", price: 1.5, cat: "drinks", photo: img("schweppes-soda.jpg") },
  { id: "sch-trop", name: "Schweppes Tropical Fusion", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-tropical.jpg") },
  { id: "sch-or", name: "Schweppes Orangeade", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.7, cat: "drinks", photo: img("schweppes-orangeade.jpg") },
  { id: "sch-lem", name: "Schweppes Soda Lemon", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.7, cat: "drinks", photo: img("schweppes-soda-lemon.jpg") },
  { id: "sch-gin", name: "Schweppes Ginger Ale", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-ginger.jpg") },
  { id: "sch-bit", name: "Schweppes Bitter Lemon", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-bitter-lemon.jpg") },
  { id: "sch-moj", name: "Schweppes Mojito", desc: "330ml κουτάκι, χωρίς αλκοόλ", price: 1.7, cat: "drinks", photo: img("schweppes-mojito.jpg") },
  { id: "sch-pom", name: "Schweppes Pomegranate", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-pomegranate.jpg") },
  { id: "sch-ber", name: "Schweppes Περγαμόντο-Ιβίσκος", desc: "330ml κουτάκι, χωρίς ζάχαρη", price: 1.7, cat: "drinks", photo: img("schweppes-bergamot.jpg") },
  { id: "sch-ch", name: "Schweppes Sour Cherry Pepper", desc: "330ml κουτάκι", price: 1.7, cat: "drinks", photo: img("schweppes-cherry.jpg") },
  { id: "blk-lg", name: "Fuze Tea Lemon Lemongrass", desc: "400ml", price: 1.8, cat: "drinks", photo: img("black-lemongrass.jpg") },
  { id: "blk-lgz", name: "Fuze Tea Lemon Lemongrass No Sugar", desc: "400ml, χωρίς ζάχαρη", price: 1.8, cat: "drinks", photo: img("black-lemongrass-zero.jpg") },
  { id: "blk-ph", name: "Fuze Tea Peach Hibiscus", desc: "400ml", price: 1.8, cat: "drinks", photo: img("black-peach-hibiscus.jpg") },
  { id: "blk-pr", name: "Fuze Tea Peach Rose No Sugar", desc: "400ml, χωρίς ζάχαρη", price: 1.8, cat: "drinks", photo: img("black-peach-rose.jpg") },
  { id: "blk-lm", name: "Fuze Tea Green Tea Lime Mint", desc: "400ml", price: 1.8, cat: "drinks", photo: img("black-lime-mint.jpg") },
  { id: "blk-pas", name: "Fuze Tea Passion Fruit No Sugar", desc: "400ml, χωρίς ζάχαρη", price: 1.8, cat: "drinks", photo: img("black-passion.jpg") },
  { id: "xixo-p", name: "XIXO Ice Tea Ροδάκινο", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-peach.jpg") },
  { id: "xixo-pz", name: "XIXO Ice Tea Ροδάκινο Zero", desc: "250ml, χωρίς ζάχαρη", price: 1.2, cat: "drinks", photo: img("xixo-peach-zero.jpg") },
  { id: "xixo-l", name: "XIXO Ice Tea Λεμόνι", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-lemon.jpg") },
  { id: "xixo-s", name: "XIXO Ice Tea Φράουλα", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-berry.jpg") },
  { id: "xixo-rb", name: "XIXO Ice Tea Raspberry Blueberry", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-raspberry.jpg") },
  { id: "xixo-gt", name: "XIXO Ice Tea Green Fusion Zero", desc: "250ml, χωρίς ζάχαρη", price: 1.2, cat: "drinks", photo: img("xixo-green.jpg") },
  { id: "xixo-t", name: "XIXO Tutti Fruity", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-tutti.jpg") },
  { id: "xixo-bc", name: "XIXO Tutti Fruity Black Cherry", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-cherry.jpg") },
  { id: "xixo-ap", name: "XIXO Tutti Fruity Apple", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-apple.jpg") },
  { id: "xixo-kw", name: "XIXO Tutti Fruity Kiwi", desc: "250ml", price: 1.2, cat: "drinks", photo: img("xixo-kiwi.jpg") },
  { id: "xixo-pl", name: "XIXO Pink Lemonade", desc: "250ml, φράουλα λάιμ", price: 1.2, cat: "drinks", photo: img("xixo-pink.jpg") },
  { id: "xixo-mo", name: "XIXO Mojito Lemonade", desc: "250ml, λάιμ μέντα", price: 1.2, cat: "drinks", photo: img("xixo-mojito.jpg") },
  { id: "pow-or", name: "Powerade Orange", desc: "500ml", price: 1.8, cat: "drinks", photo: img("powerade-orange.jpg") },
  { id: "pow-bl", name: "Powerade Blood Orange", desc: "500ml", price: 1.8, cat: "drinks", photo: img("powerade-blood.jpg") },
  { id: "pow-ci", name: "Powerade Citrus", desc: "500ml", price: 1.8, cat: "drinks", photo: img("powerade-citrus.jpg") },
  { id: "pow-mb", name: "Powerade Mountain Blast", desc: "500ml", price: 1.8, cat: "drinks", photo: img("powerade-blast.jpg") },
  { id: "pow-mbz", name: "Powerade Mountain Blast Zero", desc: "500ml, χωρίς ζάχαρη", price: 1.8, cat: "drinks", photo: img("powerade-blast-zero.jpg") },

  { id: "amita-a", name: "Amita Μήλο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-milo.jpg") },
  { id: "amita-ga", name: "Amita Πράσινο Μήλο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-prasino-milo.jpg") },
  { id: "amita-ban", name: "Amita Μπανάνα", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-banana.jpg") },
  { id: "amita-p", name: "Amita Ροδάκινο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-rodakino.jpg") },
  { id: "amita-lem", name: "Amita Λεμόνι", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-lemoni.jpg") },
  { id: "amita-v", name: "Amita Βύσσινο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-vyssino.jpg") },
  { id: "amita-o100", name: "Amita Πορτοκάλι 100%", desc: "1L φυσικός χυμός", price: 2.5, cat: "juice", photo: img("amita-portokali-100.jpg") },
  { id: "amita-mix", name: "Amita Πορτοκάλι Βερίκοκο Μήλο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-triplo.jpg") },
  { id: "amita-cran", name: "Amita Κοκτέιλ Κράνμπερι", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-cranberry.jpg") },
  { id: "amita-pin", name: "Amita Ανανάς", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-ananas.jpg") },
  { id: "amita-car", name: "Amita Μήλο Πορτοκάλι Καρότο", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-karoto.jpg") },
  { id: "amita-o", name: "Amita Πορτοκάλι", desc: "1L χυμός", price: 2.2, cat: "juice", photo: img("amita-portokali.jpg") },
  { id: "amita-m", name: "Amita Motion 1L", desc: "9 φρούτα · 7 βιταμίνες", price: 2.5, cat: "juice", photo: img("amita-motion.jpg") },
  { id: "amita-m33", name: "Amita Motion 0.33L", desc: "9 φρούτα · 7 βιταμίνες", price: 1.8, cat: "juice", photo: img("amita-motion-330.jpg") },
  { id: "amita-b", name: "Frulite Boost Πορτοκάλι Νεκταρίνι", desc: "500ml, φυσική ενέργεια", price: 2.2, cat: "juice", photo: img("amita-boost.jpg") },
  { id: "fru-s", name: "Frulite Φράουλα", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-fraoula.jpg") },
  { id: "fru-o", name: "Frulite Πορτοκάλι Καρότο Μάνγκο", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-portokali.jpg") },
  { id: "fru-v", name: "Frulite Μανταρίνι Σαγκουίνι", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-verikoko.jpg") },
  { id: "fru-p", name: "Frulite Passion Fruit Κοκτέιλ", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-rodakino.jpg") },
  { id: "fru-a", name: "Frulite Ανανάς Καρύδα", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-milo.jpg") },
  { id: "fru-b", name: "Frulite Μπανάνα Βύσσινο", desc: "0,33L φρουτοποτό", price: 1.4, cat: "juice", photo: img("frulite-banana.jpg") },

  { id: "rb", name: "Red Bull", desc: "250ml", price: 2.2, cat: "energy", photo: img("redbull.jpg") },
  { id: "rbsf", name: "Red Bull Sugarfree", desc: "250ml, χωρίς ζάχαρη", price: 2.2, cat: "energy", photo: img("redbull-sf.jpg") },
  { id: "rbz", name: "Red Bull Zero", desc: "250ml, χωρίς ζάχαρη", price: 2.2, cat: "energy", photo: img("redbull-zero.jpg") },
  { id: "rb-pe", name: "Red Bull Peach Edition", desc: "250ml, white peach", price: 2.2, cat: "energy", photo: img("redbull-peach.jpg") },
  { id: "rb-wm", name: "Red Bull Red Edition", desc: "250ml, καρπούζι", price: 2.2, cat: "energy", photo: img("redbull-red.jpg") },
  { id: "rb-su", name: "Red Bull Summer Edition", desc: "250ml, pink grapefruit", price: 2.2, cat: "energy", photo: img("redbull-summer.jpg") },
  { id: "rb-ch", name: "Red Bull Cherry Edition", desc: "250ml, κεράσι", price: 2.2, cat: "energy", photo: img("redbull-cherry.jpg") },
  { id: "hell", name: "Hell Classic", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-classic.jpg") },
  { id: "hellz", name: "Hell Classic Zero", desc: "250ml, χωρίς ζάχαρη", price: 1.5, cat: "energy", photo: img("hell-classic-zero.jpg") },
  { id: "hell-ap", name: "Hell Apple", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-apple.jpg") },
  { id: "hell-bc", name: "Hell Black Cherry", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-black-cherry.jpg") },
  { id: "hell-ct", name: "Hell Carnival Cactus Twist", desc: "250ml, limited edition", price: 1.5, cat: "energy", photo: img("hell-cactus.jpg") },
  { id: "hell-cc", name: "Hell Carnival Cotton Candy", desc: "250ml, limited edition", price: 1.5, cat: "energy", photo: img("hell-cotton.jpg") },
  { id: "hell-foc", name: "Hell Focus+", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-focus.jpg") },
  { id: "hell-mul", name: "Hell Multi+", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-multi.jpg") },
  { id: "hell-lg", name: "Hell Lemon Pink Grapefruit", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-lemon-grapefruit.jpg") },
  { id: "hell-mp", name: "Hell Melon Prickly Pear", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-melon.jpg") },
  { id: "hell-pl", name: "Hell Peach Lemon", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-peach-lemon.jpg") },
  { id: "hell-sb", name: "Hell Strawberry Banana", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-strawberry.jpg") },
  { id: "hell-sf", name: "Hell Strong Focus", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-strong-focus.jpg") },
  { id: "hell-rg", name: "Hell Strong Red Grape", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-redgrape.jpg") },
  { id: "hell-wm", name: "Hell Strong Watermelon", desc: "250ml", price: 1.5, cat: "energy", photo: img("hell-watermelon.jpg") },
  { id: "hell-zb", name: "Hell Zero Berry", desc: "250ml, χωρίς ζάχαρη", price: 1.5, cat: "energy", photo: img("hell-zero-berry.jpg") },
  { id: "hell-zp", name: "Hell Zero White Peach", desc: "250ml, χωρίς ζάχαρη", price: 1.5, cat: "energy", photo: img("hell-white-peach.jpg") },
  { id: "mon-cl", name: "Monster Energy", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-classic.jpg") },
  { id: "mon-z", name: "Monster Energy Zero Sugar", desc: "500ml, χωρίς ζάχαρη", price: 2.5, cat: "energy", photo: img("monster-zero.jpg") },
  { id: "mon-gz", name: "Monster Energy Zero Sugar Green", desc: "500ml, χωρίς ζάχαρη", price: 2.5, cat: "energy", photo: img("monster-zero-green.jpg") },
  { id: "ft", name: "Monster Full Throttle", desc: "500ml, χωρίς ζάχαρη", price: 2.2, cat: "energy", photo: img("full-throttle.jpg") },
  { id: "mon-ml", name: "Monster Mango Loco", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-mango-loco.jpg") },
  { id: "mon-doc", name: "Monster The Doctor", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-doctor.jpg") },
  { id: "mon-docz", name: "Monster The Doctor Zero", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-doctor-zero.jpg") },
  { id: "mon-ur", name: "Monster Ultra Red", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-ultra-red.jpg") },
  { id: "mon-uw", name: "Monster Ultra White", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-ultra-white.jpg") },
  { id: "mon-ug", name: "Monster Ultra Gold", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-ultra-gold.jpg") },
  { id: "mon-uf", name: "Monster Ultra Fiesta Mango", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-ultra-fiesta.jpg") },
  { id: "mon-pp", name: "Monster Pipeline Punch", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-pipeline.jpg") },
  { id: "mon-pac", name: "Monster Pacific Punch", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-pacific.jpg") },
  { id: "mon-mon", name: "Monster Monarch", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-monarch.jpg") },
  { id: "mon-lan", name: "Monster Lando Norris", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-lando.jpg") },
  { id: "mon-rr", name: "Monster Ruby Red", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-ruby-red.jpg") },
  { id: "mon-rio", name: "Monster Rio Punch", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-rio.jpg") },
  { id: "mon-str", name: "Monster Strawberry Dreams", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-strawberry.jpg") },
  { id: "mon-vik", name: "Monster Viking Berry", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-viking.jpg") },
  { id: "mon-ba", name: "Monster Bad Apple", desc: "500ml", price: 2.5, cat: "energy", photo: img("monster-bad-apple.jpg") },
  { id: "bang-ch", name: "Bang Black Cherry Vanilla", desc: "500ml", price: 2.8, cat: "energy", photo: img("bang-cherry.jpg") },
  { id: "bang-br", name: "Bang Blue Razz", desc: "500ml", price: 2.8, cat: "energy", photo: img("bang-blue-razz.jpg") },
  { id: "bang-cc", name: "Bang Cotton Candy", desc: "500ml", price: 2.8, cat: "energy", photo: img("bang-cotton.jpg") },
  { id: "bang-pm", name: "Bang Peach Mango", desc: "500ml", price: 2.8, cat: "energy", photo: img("bang-peach-mango.jpg") },

  { id: "tsak-salt", name: "Tsakiris Chips Αλάτι", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-salt.jpg") },
  { id: "tsak-ore", name: "Tsakiris Chips Ρίγανη", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-ore.jpg") },
  { id: "tsak-light", name: "Tsakiris Chips 0% Αλάτι", desc: "90g, χωρίς προσθήκη αλατιού", price: 1.5, cat: "snacks", photo: img("tsak-light.jpg") },
  { id: "tsak-vin", name: "Tsakiris Chips Αλάτι & Ξίδι", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-vin.jpg") },
  { id: "tsak-pap", name: "Tsakiris Chips Πάπρικα", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-pap.jpg") },
  { id: "tsak-sc", name: "Tsakiris Chips Sour Cream", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-sc.jpg") },
  { id: "tsak-bbq", name: "Tsakiris Κυματιστά BBQ", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-bbq.jpg") },
  { id: "tsak-wore", name: "Tsakiris Κυματιστά Ρίγανη", desc: "90g", price: 1.5, cat: "snacks", photo: img("tsak-wavy-ore.jpg") },
  { id: "tsak-stix", name: "Tsakiris Sticks Αλάτι", desc: "90g σακούλα", price: 1.5, cat: "snacks", photo: img("tsak-sticks.jpg") },
  { id: "tsak-c50", name: "Tsakiris Sticks Cup 50g", desc: "Κύπελλο αλάτι", price: 1.4, cat: "snacks", photo: img("tsak-cup50.jpg") },
  { id: "tsak-c105", name: "Tsakiris Sticks Cup 105g", desc: "Κύπελλο αλάτι", price: 1.8, cat: "snacks", photo: img("tsak-cup105.jpg") },
  { id: "tsak-ccb", name: "Tsakiris Sticks Cheese Burger", desc: "Κύπελλο 105g", price: 1.8, cat: "snacks", photo: img("tsak-cup-cb.jpg") },
  { id: "tsak-chot", name: "Tsakiris Sticks Spicy Hot", desc: "Κύπελλο 105g", price: 1.8, cat: "snacks", photo: img("tsak-cup-hot.jpg") },
  { id: "chee-lot", name: "Cheetos Γαριδάκια Lotto", desc: "80g", price: 1.2, cat: "snacks", photo: img("cheetos-lotto.jpg") },
  { id: "chee-piz", name: "Cheetos Pizza", desc: "70g", price: 1.2, cat: "snacks", photo: img("cheetos-pizza.jpg") },
  { id: "extra-g", name: "Extra Τυρογαριδάκια", desc: "80g", price: 1.0, cat: "snacks", photo: img("extra-gari.jpg") },
  { id: "chee-pako", name: "Cheetos Πακοτίνια", desc: "95g", price: 1.2, cat: "snacks", photo: img("cheetos-pako.jpg") },
  { id: "chee-drak", name: "Cheetos Δρακουλίνα", desc: "75g", price: 1.2, cat: "snacks", photo: img("cheetos-drakou.jpg") },
  { id: "tasty-f", name: "Tasty Φουντούνια", desc: "90g", price: 1.0, cat: "snacks", photo: img("tasty-foun.jpg") },

  { id: "wat", name: "Βίκος Νερό", desc: "500ml, κρύο", price: 0.5, cat: "market", photo: img("vikos-500.jpg") },
  { id: "vikos15", name: "Βίκος Νερό 1.5L", desc: "Φυσικό μεταλλικό", price: 0.8, cat: "market", photo: img("vikos-15.jpg") },
  { id: "ion-m", name: "ION Γάλακτος", desc: "70g", price: 1.5, cat: "market", photo: img("ion-milk.jpg") },
  { id: "ion-al", name: "ION Αμυγδάλου", desc: "30g", price: 0.9, cat: "market", photo: img("ion-almond.jpg") },
  { id: "ion-br", name: "ION Break", desc: "85g, φουντούκι", price: 1.8, cat: "market", photo: img("ion-break.jpg") },
  { id: "ion-sf", name: "ION Σοκοφρέτα", desc: "38g", price: 1.0, cat: "market", photo: img("ion-sokofreta.jpg") },
  { id: "ion-de", name: "ION Derby", desc: "38g, καρύδα", price: 0.8, cat: "market", photo: img("ion-derby.jpg") },
  { id: "kbuen", name: "Kinder Bueno", desc: "43g", price: 1.5, cat: "market", photo: img("kinder-bueno.jpg") },
  { id: "kbuenw", name: "Kinder Bueno White", desc: "39g", price: 1.5, cat: "market", photo: img("kinder-bueno-white.jpg") },
  { id: "kitkat", name: "KitKat", desc: "41.5g", price: 1.2, cat: "market", photo: img("kitkat.jpg") },
  { id: "lacta", name: "Lacta Γάλακτος", desc: "85g", price: 1.5, cat: "market", photo: img("lacta.jpg") },
  { id: "snick", name: "Snickers", desc: "50g", price: 1.2, cat: "market", photo: img("snickers.jpg") },
  { id: "mars", name: "Mars", desc: "51g", price: 1.2, cat: "market", photo: img("mars.jpg") },
  { id: "twix", name: "Twix", desc: "50g", price: 1.2, cat: "market", photo: img("twix.jpg") },
  { id: "bounty", name: "Bounty", desc: "57g", price: 1.2, cat: "market", photo: img("bounty.jpg") },
  { id: "trid-ss", name: "Trident Senses Δυόσμος", desc: "27g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-senses-spearmint.jpg") },
  { id: "trid-sw", name: "Trident Senses Καρπούζι", desc: "27g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-senses-watermelon.jpg") },
  { id: "trid-sf", name: "Trident Senses Φράουλα", desc: "27g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-senses-strawberry.jpg") },
  { id: "trid-ms", name: "Trident Max Δυόσμος", desc: "27g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-max-spearmint.jpg") },
  { id: "trid-mp", name: "Trident Max Peppermint", desc: "27g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-max-peppermint.jpg") },
  { id: "trid-ls", name: "Trident Long Lasting Δυόσμος", desc: "22g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-long-spearmint.jpg") },
  { id: "trid-lm", name: "Trident Long Lasting Μέντα", desc: "22g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-long-mint.jpg") },
  { id: "trid-ll", name: "Trident Long Lasting Φράουλα Λάιμ", desc: "22g, χωρίς ζάχαρη", price: 1.0, cat: "market", photo: img("trident-long-strawberry.jpg") },

  { id: "marl", name: "Marlboro Red", desc: "Κόκκινο πακέτο", price: 5.5, cat: "smokes", photo: img("marlboro.jpg") },
  { id: "marlg", name: "Marlboro Gold", desc: "Χρυσό πακέτο", price: 5.5, cat: "smokes", photo: img("pack-gold.jpg") },
  { id: "marlt", name: "Marlboro Touch", desc: "Slim", price: 5.5, cat: "smokes", photo: img("pack-slim.jpg") },
  { id: "winst", name: "Winston Classic Red Greece", desc: "Limited Edition · 20άδα", price: 5.2, cat: "smokes", photo: img("winston-greece-red.jpg") },
  { id: "winstb", name: "Winston Legend Blue", desc: "20άδα", price: 5.2, cat: "smokes", photo: img("winston-legend-blue.jpg") },
  { id: "winst-fw", name: "Winston 100s Fine White", desc: "100s", price: 5.4, cat: "smokes", photo: img("winston-fine-white.jpg") },
  { id: "winst-ts", name: "Winston 100s True Silver", desc: "100s", price: 5.4, cat: "smokes", photo: img("winston-true-silver.jpg") },
  { id: "winst-gr", name: "Winston 100s Classic Red Greece", desc: "Limited Edition · 100s", price: 5.4, cat: "smokes", photo: img("winston-greece-100s.jpg") },
  { id: "davi", name: "Davidoff Slim", desc: "Slim", price: 5.8, cat: "smokes", photo: img("davidoff.jpg") },
  { id: "davic", name: "Davidoff Classic", desc: "Κλασικό", price: 5.8, cat: "smokes", photo: img("davidoff.jpg") },
  { id: "camely", name: "Camel Yellow", desc: "Κίτρινο", price: 5.2, cat: "smokes", photo: img("pack-gold.jpg") },
  { id: "camelb", name: "Camel Blue", desc: "Μπλε", price: 5.2, cat: "smokes", photo: img("pack-blue.jpg") },
  { id: "lucky", name: "Lucky Strike", desc: "Κόκκινο", price: 5.0, cat: "smokes", photo: img("pack-red.jpg") },
  { id: "parl", name: "Parliament", desc: "Aqua slim", price: 5.8, cat: "smokes", photo: img("pack-slim.jpg") },
  { id: "kar", name: "Karelia Red", desc: "Κόκκινο", price: 4.8, cat: "smokes", photo: img("pack-red.jpg") },
  { id: "kars", name: "Karelia Slim", desc: "Slim", price: 5.0, cat: "smokes", photo: img("pack-slim.jpg") },
  { id: "pall", name: "Pall Mall", desc: "Κόκκινο", price: 4.7, cat: "smokes", photo: img("pack-gold.jpg") },
  { id: "lm", name: "L&M Blue", desc: "Μπλε", price: 4.8, cat: "smokes", photo: img("pack-blue.jpg") },
  { id: "assos", name: "Assos", desc: "Διεθνές", price: 4.5, cat: "smokes", photo: img("pack-red.jpg") },
  { id: "chest", name: "Chesterfield", desc: "Κόκκινο", price: 4.7, cat: "smokes", photo: img("pack-red.jpg") },

  { id: "iluma-one", name: "IQOS ILUMA i ONE", desc: "Συσκευή · Breeze Blue", price: 39.0, cat: "heat", photo: img("iqos-iluma-one.jpg") },
  { id: "iluma-mid", name: "IQOS ILUMA i MID", desc: "Συσκευή + θήκη · Breeze Blue", price: 69.0, cat: "heat", photo: img("iqos-iluma-mid.jpg") },
  { id: "iluma-prime", name: "IQOS ILUMA i PRIME", desc: "Συσκευή + θήκη · Garnet", price: 89.0, cat: "heat", photo: img("iqos-iluma-prime.jpg") },
  { id: "glo-x2", name: "glo Hyper X2", desc: "Συσκευή", price: 25.0, cat: "heat", photo: img("glo-hyper-x2.jpg") },
  { id: "glo-pro", name: "glo Hyper Pro", desc: "Συσκευή", price: 35.0, cat: "heat", photo: img("glo-hyper-pro.jpg") },
  { id: "glo-hilo", name: "glo HILO", desc: "Συσκευή · για virto/rivo", price: 25.0, cat: "heat", photo: img("glo-hilo.jpg") },
  { id: "glo-hiloplus", name: "glo HILO Plus", desc: "Συσκευή · για virto/rivo", price: 39.0, cat: "heat", photo: img("glo-hilo-plus.jpg") },

  { id: "ter-br", name: "Terea Bronze", desc: "IQOS ILUMA · ζεστό χαρμάνι", price: 4.0, cat: "heat", photo: img("terea-bronze.jpg") },
  { id: "ter-si", name: "Terea Sienna", desc: "IQOS ILUMA · νότες ξύλου", price: 4.0, cat: "heat", photo: img("terea-sienna.jpg") },
  { id: "ter-am", name: "Terea Amber", desc: "IQOS ILUMA · ισορροπημένο", price: 4.0, cat: "heat", photo: img("terea-amber.jpg") },
  { id: "ter-ru", name: "Terea Russet", desc: "IQOS ILUMA · έντονο", price: 4.0, cat: "heat", photo: img("terea-russet.jpg") },
  { id: "ter-be", name: "Terea Beige", desc: "IQOS ILUMA · απαλό", price: 4.0, cat: "heat", photo: img("terea-beige.jpg") },
  { id: "ter-sf", name: "Terea Soft Fuse", desc: "IQOS ILUMA · φρέσκο", price: 4.0, cat: "heat", photo: img("terea-softfuse.jpg") },
  { id: "ter-tu", name: "Terea Turquoise", desc: "IQOS ILUMA · ζωηρό", price: 4.0, cat: "heat", photo: img("terea-turquoise.jpg") },
  { id: "ter-sv", name: "Terea Silver", desc: "IQOS ILUMA · απαλό", price: 4.0, cat: "heat", photo: img("terea-silver.jpg") },
  { id: "ter-tk", name: "Terea Teak", desc: "IQOS ILUMA · πλούσιο", price: 4.0, cat: "heat", photo: img("terea-warm.jpg") },
  { id: "ter-ye", name: "Terea Yellow", desc: "IQOS ILUMA · αρωματικό", price: 4.0, cat: "heat", photo: img("terea-cool.jpg") },

  { id: "del-sv", name: "Delia Classic Silver", desc: "για IQOS · 20 ράβδοι", price: 3.5, cat: "heat", photo: img("delia-silver.jpg") },
  { id: "del-rd", name: "Delia Classic Red", desc: "για IQOS · 20 ράβδοι", price: 3.5, cat: "heat", photo: img("delia-red.jpg") },
  { id: "del-gr", name: "Delia Classic Green", desc: "για IQOS · 20 ράβδοι", price: 3.5, cat: "heat", photo: img("delia-green.jpg") },

  { id: "evo-bu", name: "Ploom EVO Burgundy", desc: "Ράβδοι καπνού Ploom", price: 4.25, cat: "heat", photo: img("evo-pack.jpg") },
  { id: "evo-tn", name: "Ploom EVO Tan", desc: "Πλούσιο, γλυκό", price: 4.25, cat: "heat", photo: img("evo-pack.jpg") },
  { id: "evo-ga", name: "Ploom EVO Garnet", desc: "Αρωματικό", price: 4.25, cat: "heat", photo: img("evo-pack.jpg") },
  { id: "evo-go", name: "Ploom EVO Gold", desc: "Ήπιο χαρμάνι", price: 4.25, cat: "heat", photo: img("pack-gold.jpg") },
  { id: "evo-sv", name: "Ploom EVO Silver", desc: "Απαλή γεύση καπνού", price: 4.25, cat: "heat", photo: img("pack-slim.jpg") },
  { id: "evo-gr", name: "Ploom EVO Green", desc: "Φρεσκάδα", price: 4.25, cat: "heat", photo: img("neo-mint.jpg") },
  { id: "evo-te", name: "Ploom EVO Teal", desc: "Δροσερές νότες", price: 4.25, cat: "heat", photo: img("terea-cool.jpg") },

  { id: "neo-cl", name: "glo neo Classic Tobacco", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-classic.jpg") },
  { id: "neo-go", name: "glo neo Golden Tobacco", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-golden.jpg") },
  { id: "neo-te", name: "glo neo Terracotta", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-terracotta.jpg") },
  { id: "neo-sv", name: "glo neo Silver Tobacco", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-silver.jpg") },
  { id: "neo-sig", name: "glo neo Signature Tobacco", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-signature.jpg") },
  { id: "neo-az", name: "glo neo Azure", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-azure.jpg") },
  { id: "neo-sc", name: "glo neo Scarlet", desc: "20 ράβδοι · Hyper", price: 3.0, cat: "heat", photo: img("neo-scarlet.jpg") },

  { id: "veo-sc", name: "glo veo Scarlet Click", desc: "20 ράβδοι · κόκκινα μούρα", price: 3.0, cat: "heat", photo: img("veo-scarlet.jpg") },
  { id: "veo-gr", name: "glo veo Green Click", desc: "20 ράβδοι · μέντα", price: 3.0, cat: "heat", photo: img("veo-green.jpg") },
  { id: "veo-ar", name: "glo veo Arctic Click", desc: "20 ράβδοι · δυόσμος", price: 3.0, cat: "heat", photo: img("veo-arctic.jpg") },
  { id: "veo-vi", name: "glo veo Violet Click", desc: "20 ράβδοι · blueberry", price: 3.0, cat: "heat", photo: img("veo-violet.jpg") },
  { id: "veo-tt", name: "glo veo Tropical Twist", desc: "20 ράβδοι · μάνγκο ροδάκινο", price: 3.0, cat: "heat", photo: img("veo-tropical.jpg") },
  { id: "veo-bt", name: "glo veo Blossom Twist", desc: "20 ράβδοι · κεράσι καρύδα", price: 3.0, cat: "heat", photo: img("veo-blossom.jpg") },
  { id: "veo-pt", name: "glo veo Polar Twist", desc: "20 ράβδοι · έντονη μέντα", price: 3.0, cat: "heat", photo: img("veo-polar.jpg") },
  { id: "veo-in", name: "glo veo Indigo Twist", desc: "20 ράβδοι", price: 3.0, cat: "heat", photo: img("veo-indigo.jpg") },

  { id: "vir-cl", name: "glo virto Classic Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-classic.jpg") },
  { id: "vir-go", name: "glo virto Golden Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-golden.jpg") },
  { id: "vir-sg", name: "glo virto Signature Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-signature.jpg") },
  { id: "vir-sv", name: "glo virto Silver Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-silver.jpg") },
  { id: "vir-az", name: "glo virto Azure Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-azure.jpg") },
  { id: "vir-ri", name: "glo virto Rich Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-rich.jpg") },
  { id: "vir-ba", name: "glo virto Balanced Tobacco", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("virto-balanced.jpg") },

  { id: "riv-ar", name: "glo rivo Arctic Click", desc: "20 ράβδοι · HILO · μέντα", price: 4.0, cat: "heat", photo: img("rivo-arctic.jpg") },
  { id: "riv-gr", name: "glo rivo Green Click", desc: "20 ράβδοι · HILO · μέντα", price: 4.0, cat: "heat", photo: img("rivo-green.jpg") },
  { id: "riv-sc", name: "glo rivo Scarlet Click", desc: "20 ράβδοι · HILO · μούρα", price: 4.0, cat: "heat", photo: img("rivo-scarlet.jpg") },
  { id: "riv-vi", name: "glo rivo Violet Click", desc: "20 ράβδοι · HILO · blueberry", price: 4.0, cat: "heat", photo: img("rivo-violet.jpg") },
  { id: "riv-sp", name: "glo rivo Sour Pink Twist", desc: "20 ράβδοι · HILO", price: 4.0, cat: "heat", photo: img("rivo-sourpink.jpg") },

  { id: "v1-tob", name: "VEEV ONE Classic Tobacco", desc: "Pod · καπνός", price: 3.2, cat: "heat", photo: img("veev-tobacco.jpg") },
  { id: "v1-bal", name: "VEEV ONE Balanced Tobacco", desc: "Pod · καφές & καπνός", price: 3.2, cat: "heat", photo: img("veev-tobacco.jpg") },
  { id: "v1-mint", name: "VEEV ONE Blue Mint", desc: "Pod · μέντα", price: 3.2, cat: "heat", photo: img("veev-mint.jpg") },
  { id: "v1-sea", name: "VEEV ONE Sea Mint", desc: "Pod · θαλασσινή μέντα", price: 3.2, cat: "heat", photo: img("veev-mint.jpg") },
  { id: "v1-str", name: "VEEV ONE Strawberry", desc: "Pod · φράουλα", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-man", name: "VEEV ONE Mango", desc: "Pod · μάνγκο", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-blu", name: "VEEV ONE Blueberry", desc: "Pod · blueberry", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-wat", name: "VEEV ONE Watermelon", desc: "Pod · καρπούζι", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-gra", name: "VEEV ONE Grape", desc: "Pod · σταφύλι", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-app", name: "VEEV ONE Sour Apple", desc: "Pod · πράσινο μήλο", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-che", name: "VEEV ONE Cherry", desc: "Pod · κεράσι", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "v1-mel", name: "VEEV ONE Melon Coconut", desc: "Pod · πεπόνι καρύδα", price: 3.2, cat: "heat", photo: img("veev-fruit.jpg") },

  { id: "vp-gold", name: "VEEV Prime Gold Tobacco", desc: "Pod inPRIME · καπνός", price: 4.0, cat: "heat", photo: img("veev-tobacco.jpg") },
  { id: "vp-mint", name: "VEEV Prime Blue Mint", desc: "Pod inPRIME · μέντα", price: 4.0, cat: "heat", photo: img("veev-mint.jpg") },
  { id: "vp-str", name: "VEEV Prime Strawberry", desc: "Pod inPRIME · φράουλα", price: 4.0, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "vp-app", name: "VEEV Prime Sour Apple", desc: "Pod inPRIME · μήλο", price: 4.0, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "vp-ll", name: "VEEV Prime Lemon Lime", desc: "Pod inPRIME · εσπεριδοειδή", price: 4.0, cat: "heat", photo: img("veev-mint.jpg") },
  { id: "vp-brs", name: "VEEV Prime Blue Raspberry", desc: "Pod inPRIME · raspberry", price: 4.0, cat: "heat", photo: img("veev-fruit.jpg") },
  { id: "vp-che", name: "VEEV Prime Cherry", desc: "Pod inPRIME · κεράσι", price: 4.0, cat: "heat", photo: img("veev-fruit.jpg") },
];

function defaultStock(cat: ProductCat) {
  if (cat === "coffee") return 40;
  if (cat === "bread") return 18;
  if (cat === "smokes" || cat === "heat") return 24;
  return 36;
}

export const DEFAULT_PRODUCTS: Product[] = BASE_MENU.map((p) => ({
  ...p,
  stock: defaultStock(p.cat),
}));

export function mergeMenu(saved: unknown): Product[] {
  if (!Array.isArray(saved) || saved.length === 0) return DEFAULT_PRODUCTS.slice();
  const defaults = new Map(DEFAULT_PRODUCTS.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const fromSaved = saved
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const p = raw as Partial<Product>;
      if (!p.id || !p.name) return null;
      const d = defaults.get(p.id);
      const cat = asProductCat(p.cat ?? d?.cat);
      seen.add(String(p.id));
      return {
        id: String(p.id),
        name: String(p.name),
        desc: String(p.desc ?? d?.desc ?? ""),
        price: Number(p.price ?? d?.price ?? 0),
        cat,
        photo: String(p.photo || d?.photo || ""),
        stock: Number(p.stock ?? d?.stock ?? 24),
      } satisfies Product;
    })
    .filter((p): p is Product => p !== null);
  const missing = DEFAULT_PRODUCTS.filter((p) => !seen.has(p.id));
  return fromSaved.concat(missing);
}

export function cartCount(cart: CartMap) {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function cartLines(cart: CartMap, products: Product[]): OrderItem[] {
  return Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      if (!p) return null;
      return { id, name: p.name, qty, price: p.price };
    })
    .filter((x): x is OrderItem => x !== null);
}

export function cartTotals(items: OrderItem[], fee: number) {
  const sub = items.reduce((s, it) => s + it.price * it.qty, 0);
  return { sub, fee, grand: sub + fee };
}

export const PAY_LABEL: Record<PayMethod, string> = {
  cash: "Μετρητά στην παράδοση",
  card: "Κάρτα στην παράδοση",
};

export function buildWhatsAppMessage(order: Order) {
  const lines = order.items
    .map((it) => `• ${it.name} ×${it.qty} — ${money(it.price * it.qty)}`)
    .join("\n");
  const floor = order.data.floor ? `\nΌροφος / κουδούνι: ${order.data.floor}` : "";
  const notes = order.data.notes ? `\nΣημείωση: ${order.data.notes}` : "";
  return [
    `Dose — νέα παραγγελία`,
    formatWhen(order.at),
    "",
    order.data.name,
    order.data.phone,
    order.data.address + floor,
    notes,
    "",
    lines,
    "",
    `Υποσύνολο ${money(order.totals.sub)}`,
    `Μεταφορικά ${money(order.totals.fee)}`,
    `Σύνολο ${money(order.totals.grand)}`,
    `Πληρωμή: ${PAY_LABEL[order.data.pay]}`,
  ]
    .filter((x) => x !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("el-GR");
  } catch {
    return iso;
  }
}

function money(n: number) {
  return n.toFixed(2).replace(".", ",") + "€";
}
