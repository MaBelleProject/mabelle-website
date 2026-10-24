import FeedbackPopup from "@/components/feedback-popup";
import Footer from "@/components/footer";
import Header from "@/components/header";
import MenuSidebar from "@/components/menu-sidebar";
import ScrollToTop from "@/components/scroll-to-top";
import WhatsAppButton from "@/components/whatsapp-button";
import { CartProvider } from "@/context/cart-context";
import { CustomerProvider } from "@/context/customer-context";
import { FavoritesProvider } from "@/context/favorites-context";
import { MenuProvider } from "@/context/menu-context";
import { OffersProvider } from "@/context/offers-context";
import { ProductOriginsProvider } from "@/context/product-origins-context";
import { ProductRatingsProvider } from "@/context/product-ratings-context";
import { ShowStockLeftProvider } from "@/context/settings-context";
import { cachedStorefrontApi } from "@/lib/cached-storefront";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

// The layout uses dynamic client hooks (usePathname in MenuSidebar) — opt out of
// App Shell prerendering validation while retaining 'use cache' stale-based browser caching.
export const instant = false;

export const metadata: Metadata = {
  title: "Mabelle Bites",
  description: "Delicious treats and bites, crafted with love.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [brands, settings, sections, offers, products, productRatings] = await Promise.all([
    cachedStorefrontApi.brands().catch(() => []),
    cachedStorefrontApi.settings().catch(() => null),
    cachedStorefrontApi.sections().catch(() => []),
    cachedStorefrontApi.offers().catch(() => []),
    cachedStorefrontApi.products().catch(() => []),
    cachedStorefrontApi.allProductRatings().catch(() => []),
  ]);
  const origins = Object.fromEntries(products.filter(p => p.madeIn).map(p => [p.id, p.madeIn]));

  return (
    <html lang="en" className={geist.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){if("scrollRestoration"in history)history.scrollRestoration="manual";function r(){window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;}document.addEventListener("DOMContentLoaded",r);window.addEventListener("load",function(){r();var done=false;window.addEventListener("scroll",function(){done=true;},{once:true,passive:true});[50,150,300,500].forEach(function(ms){setTimeout(function(){if(!done)r();},ms);});});window.addEventListener("beforeunload",r);window.addEventListener("pageshow",function(e){r();setTimeout(r,300);});})();` }} />
      </head>
      <body>
        <CartProvider>
          <CustomerProvider>
            <FavoritesProvider>
              <OffersProvider offers={offers}>
                <ProductOriginsProvider origins={origins}>
                  <ProductRatingsProvider ratings={productRatings}>
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
                          <Suspense fallback={null}><ScrollToTop /></Suspense>
                          <MenuSidebar sections={sections} />
                          <div className="flex-1 min-w-0 flex flex-col">
                            <Header brands={brands} settings={settings} />
                            <main className="flex-1">{children}</main>
                            <Footer settings={settings} />
                            <WhatsAppButton phoneNumber={settings?.phoneNumber} />
                            <FeedbackPopup />
                          </div>
                        </div>
                      </MenuProvider>
                    </ShowStockLeftProvider>
                  </ProductRatingsProvider>
                </ProductOriginsProvider>
              </OffersProvider>
            </FavoritesProvider>
          </CustomerProvider>
        </CartProvider>
      </body>
    </html>
  );
}
