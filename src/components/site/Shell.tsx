import { Header } from "./Header";
import { Footer } from "./Footer";

export function Shell({
  children,
  showCart = true,
  home = false,
}: {
  children: React.ReactNode;
  showCart?: boolean;
  home?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <Header showCart={showCart} home={home} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
