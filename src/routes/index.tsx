import { Link, createFileRoute, getRouteApi } from "@tanstack/react-router";
import { Shell } from "@/components/site/Shell";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { FEATURED_IDS, type ProductCat } from "@/lib/catalog";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { shop: live, products } = rootRoute.useLoaderData();
  const featured = FEATURED_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  return (
    <Shell showCart={false} home>
      <section className="relative grid min-h-[88vh] place-items-center overflow-hidden px-5 py-16 text-center">
        <img
          src="/images/shop-corner.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/55 to-bg" />
        <div className="relative z-10 mx-auto max-w-xl">
          <div className="mx-auto mb-2 w-[min(420px,86vw)]">
            <img
              src="/images/logo-tight.jpg"
              alt="Dose Coffee & More"
              className="h-auto w-full mix-blend-lighten outline-none"
            />
          </div>
          <p className="mb-4 text-xs uppercase tracking-[0.32em] text-cream-dim">
            Καφές · Ψωμί · Αναψυκτικά · Τσιγάρα
          </p>
          <p className="mx-auto mb-8 max-w-[560px] text-lg font-light text-muted">
            Η δόση που χρειάζεσαι μέσα στη μέρα. Φρέσκος καφές, ζεστό ψωμί,
            ψιλικά και τσιγάρα — στη γωνία, ή στο κατώφλι σου.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/shop" className={cn(buttonVariants({ variant: "cream" }))}>
              Δες τα προϊόντα
            </Link>
            <a href="#visit" className={cn(buttonVariants({ variant: "ghost" }))}>
              Τοποθεσία
            </a>
          </div>
        </div>
      </section>

      <section className="grid border-y border-line md:grid-cols-3">
        <div className="px-5 py-6 text-center md:border-r md:border-line">
          <span className="block font-display text-2xl">{live.hours}</span>
          <small className="text-xs uppercase tracking-[0.08em] text-muted">
            {live.hoursNote}
          </small>
        </div>
        <div className="border-t border-line px-5 py-6 text-center md:border-t-0 md:border-r md:border-line">
          <span className="block font-display text-2xl">Delivery</span>
          <small className="text-xs uppercase tracking-[0.08em] text-muted">
            Στη γειτονιά · από {live.minOrder.toFixed(0)}€
          </small>
        </div>
        <div className="border-t border-line px-5 py-6 text-center md:border-t-0">
          <span className="block font-display text-2xl">Γωνιακό κατάστημα</span>
          <small className="text-xs uppercase tracking-[0.08em] text-muted">
            Πεζόδρομος & φανάρι
          </small>
        </div>
      </section>

      <section id="about" className="px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-xl text-center">
          <p className="eyebrow">Το μαγαζί</p>
          <h2 className="mb-3.5 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
            Μικρό, πράσινο, στη γωνία.
          </h2>
          <p className="text-muted">
            Το Dose είναι καφετέρια και ψιλικατζίδικο μαζί. Έρχεσαι για τον
            καφέ σου, παίρνεις κουλούρι, τσιγάρα και φεύγεις με νερό ή ένα
            καρβέλι για το βράδυ.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 pb-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MoodCard
            to="/shop"
            search={{ cat: "coffee" }}
            img="/images/espresso.jpg"
            alt="Καφές"
            title="Καφές"
            copy="Freddo, φραπέ, καπουτσίνο."
          />
          <MoodCard
            to="/shop"
            search={{ cat: "bread" }}
            img="/images/bread.jpg"
            alt="Ψωμί"
            title="Ψωμί"
            copy="Κουλούρι, καρβέλι και πίτες."
          />
          <MoodCard
            to="/shop"
            search={{ cat: "drinks" }}
            img="/images/drinks.jpg"
            alt="Αναψυκτικά"
            title="Αναψυκτικά"
            copy="Cola, Fanta, Schweppes, Monster."
          />
          <MoodCard
            to="/shop"
            search={{ cat: "smokes" }}
            img="/images/smokes.jpg"
            alt="Τσιγάρα"
            title="Τσιγάρα"
            copy="Marlboro, Winston, Karelia."
          />
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-[1100px] px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <p className="eyebrow">Τα συχνά</p>
            <h2 className="mb-3.5 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
              Αυτό που ζητάνε.
            </h2>
            <p className="text-muted">
              Freddo, φραπέ, καπουτσίνο και τα τσιγάρα που φεύγουν πρώτα.
            </p>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              to="/shop"
              className={cn(
                buttonVariants({ variant: "cream", size: "md" }),
                "min-w-48",
              )}
            >
              Όλα τα προϊόντα
            </Link>
          </div>
        </section>
      ) : null}

      <section
        id="visit"
        className="mx-auto max-w-[640px] px-5 py-16 text-center md:px-8 md:py-24"
      >
        <p className="eyebrow">Τοποθεσία</p>
        <h2 className="mb-3.5 font-display text-[clamp(2rem,5vw,3.25rem)] leading-[1.1]">
          Στη γωνία.
        </h2>
        <p className="text-muted">
          Γωνιακό κατάστημα με πράσινη πρόσοψη. Άνοιξε την πόρτα ή κάτσε για
          δύο λεπτά στο πεζοδρόμιο με τον καφέ στο χέρι.
        </p>
        <address className="mt-5 not-italic text-muted">
          <strong className="text-cream">Dose Coffee & More</strong>
          <br />
          {live.addressLine}
          <br />
          {live.city}
        </address>
        <p className="mt-4 text-muted">
          {live.hoursNote}
          <br />
          {live.hours}
        </p>
        <a
          href={`tel:+30${live.phone.replace(/\D/g, "").replace(/^30/, "")}`}
          className={cn(buttonVariants({ variant: "ghost" }), "mt-6")}
        >
          Κάλεσε μας
        </a>
      </section>
    </Shell>
  );
}

function MoodCard({
  to,
  search,
  img,
  alt,
  title,
  copy,
}: {
  to: "/shop";
  search: { cat: ProductCat };
  img: string;
  alt: string;
  title: string;
  copy: string;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="overflow-hidden border border-line bg-bg-2"
    >
      <img src={img} alt={alt} className="h-56 w-full object-cover md:h-64" />
      <div className="p-5">
        <h3 className="font-display text-[1.75rem]">{title}</h3>
        <p className="mt-2 text-muted">{copy}</p>
      </div>
    </Link>
  );
}
