import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { MenuProvider } from "@/context/menu-context";
import { CustomerProvider } from "@/context/customer-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { OffersProvider } from "@/context/offers-context";
import { ShowStockLeftProvider } from "@/context/settings-context";
import { storefrontApi } from "@/lib/api";
import Header from "@/components/header";
import MenuSidebar from "@/components/menu-sidebar";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mabelle Bites",
  description: "Delicious treats and bites, crafted with love.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [brands, settings, sections, offers] = await Promise.all([
    storefrontApi.brands().catch(() => []),
    storefrontApi.settings().catch(() => null),
    storefrontApi.sections().catch(() => []),
    storefrontApi.offers().catch(() => []),
  ]);

  return (
    <html lang="en" className={geist.variable}>
      <body>
        <CartProvider>
          <CustomerProvider>
          <FavoritesProvider>
          <OffersProvider offers={offers}>
          <ShowStockLeftProvider value={settings?.showStockLeft ?? false}>
          <MenuProvider>
            {/*
             * Flex row: [sidebar spacer] [content column]
             * The sidebar spacer's width transitions 0 ↔ 18rem, which
             * causes the content column (flex-1) to shrink/grow — the
             * "push" effect. The actual visible sidebar is a fixed panel
             * inside MenuSidebar that slides in sync with the spacer.
             */}
            <div className="flex min-h-screen">
              <MenuSidebar sections={sections} />
              <div className="flex-1 min-w-0 flex flex-col">
                <Header brands={brands} settings={settings} />
                <main className="flex-1">{children}</main>
                <Footer settings={settings} />
                <WhatsAppButton phoneNumber={settings?.phoneNumber} />
              </div>
            </div>
          </MenuProvider>
          </ShowStockLeftProvider>
          </OffersProvider>
          </FavoritesProvider>
          </CustomerProvider>
        </CartProvider>
      </body>
    </html>
  );
}
