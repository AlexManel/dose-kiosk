import { useEffect } from "react";
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toast } from "@/components/site/Toast";
import { CartSheet } from "@/components/cart/CartSheet";
import { getCatalog } from "@/lib/dose.functions";
import { useDose } from "@/lib/store";
import appCss from "../styles.css?url";

const APP_NAME = "Dose — Coffee & More";
const APP_DESC =
  "Dose. Καφές, ψωμί και ψιλικά στη γειτονιά σου. Παράγγειλε για delivery.";

export const Route = createRootRoute({
  loader: () => getCatalog(),
  staleTime: 0,
  gcTime: 0,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: APP_DESC },
      { name: "theme-color", content: "#070707" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  const catalog = Route.useLoaderData();

  useEffect(() => {
    useDose.getState().applyCatalog(catalog.products, catalog.shop);
    useDose.getState().hydrate();
  }, [catalog]);

  return (
    <html lang="el" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-cream font-sans">
        <PreviewHostBridge />
        <div className="noise" aria-hidden="true" />
        <AuthProvider>
          <Outlet />
          <CartSheet />
          <Toast />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
