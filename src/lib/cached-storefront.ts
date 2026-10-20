/**
 * Server-only cached wrappers around storefrontApi using Next.js 16 'use cache' directive.
 *
 * 'use cache' + cacheLife() controls BOTH server-side caching AND the browser Router Cache
 * stale window. During the stale period the browser serves navigations from its own cache
 * with zero server round-trips — this is the fix for repeated GET requests on back-navigation.
 *
 * DO NOT import this file from "use client" components — use storefrontApi from api.ts instead.
 */
import { cacheLife } from 'next/cache';
import { storefrontApi } from './api';

// hours profile: stale=5 min, revalidate=1 hr, expire=1 day
// Use for structural/display data (brands, sections, carousel, settings, gifts, packaging).
async function fetchCarousel() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.carousel();
}

async function fetchBrands() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.brands();
}

async function fetchSections() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.sections();
}

async function fetchSettings() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.settings();
}

async function fetchGifts() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.gifts();
}

async function fetchGift(id: number) {
  'use cache';
  cacheLife('hours');
  return storefrontApi.gift(id);
}

async function fetchGiftPackaging() {
  'use cache';
  cacheLife('hours');
  return storefrontApi.giftPackaging();
}

// minutes profile: stale=5 min, revalidate=1 min, expire=1 hr
// Reviews change when admin approves/hides — use minutes so changes appear quickly.
async function fetchPublicReviews() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.publicReviews();
}

async function fetchProductReviews(id: number) {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.productReviews(id);
}

async function fetchGeneralReviews() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.generalReviews();
}

async function fetchAllProductRatings() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.allProductRatings();
}

// minutes profile: stale=5 min, revalidate=1 min, expire=1 hr
// Use for price/stock-sensitive data (products, offers, bundles, best-sellers).
async function fetchOffers() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.offers();
}

async function fetchBestSellers() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.bestSellers();
}

async function fetchBundles() {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.bundles();
}

async function fetchBundle(id: number) {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.bundle(id);
}

async function fetchProducts(params?: Parameters<typeof storefrontApi.products>[0]) {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.products(params);
}

async function fetchProduct(id: number) {
  'use cache';
  cacheLife('minutes');
  return storefrontApi.product(id);
}

export const cachedStorefrontApi = {
  carousel: fetchCarousel,
  brands: fetchBrands,
  sections: fetchSections,
  settings: fetchSettings,
  offers: fetchOffers,
  bestSellers: fetchBestSellers,
  bundles: fetchBundles,
  bundle: fetchBundle,
  gifts: fetchGifts,
  gift: fetchGift,
  giftPackaging: fetchGiftPackaging,
  products: fetchProducts,
  product: fetchProduct,
  publicReviews: fetchPublicReviews,
  productReviews: fetchProductReviews,
  generalReviews: fetchGeneralReviews,
  allProductRatings: fetchAllProductRatings,
};
