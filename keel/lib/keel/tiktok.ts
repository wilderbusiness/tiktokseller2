import crypto from "node:crypto";

import { requireEnv } from "./env";
import { figure } from "./figures";
import type { CatalogProduct } from "./types";

const SHOP_HOST = "https://open-api.tiktokglobalshop.com";
const CREATOR_HOST = "https://open.tiktokapis.com";

type ShopCreds = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher: string;
};

export function shopCredentials(): ShopCreds | null {
  const check = requireEnv([
    "TIKTOK_SHOP_APP_KEY",
    "TIKTOK_SHOP_APP_SECRET",
    "TIKTOK_SHOP_ACCESS_TOKEN",
    "TIKTOK_SHOP_CIPHER",
  ]);
  if (!check.ok) return null;
  return {
    appKey: check.values.TIKTOK_SHOP_APP_KEY,
    appSecret: check.values.TIKTOK_SHOP_APP_SECRET,
    accessToken: check.values.TIKTOK_SHOP_ACCESS_TOKEN,
    shopCipher: check.values.TIKTOK_SHOP_CIPHER,
  };
}

export function signShopRequest(path: string, params: Record<string, string>, body: string, secret: string): string {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign" && key !== "access_token")
    .sort();
  const base = secret + path + keys.map((key) => key + params[key]).join("") + body + secret;
  return crypto.createHmac("sha256", secret).update(base).digest("hex");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

export async function fetchTikTokShopProducts(fetchImpl: typeof fetch = fetch): Promise<CatalogProduct[]> {
  const creds = shopCredentials();
  if (!creds) {
    throw new Error(
      "TikTok Shop is not connected. Set TIKTOK_SHOP_APP_KEY, TIKTOK_SHOP_APP_SECRET, TIKTOK_SHOP_ACCESS_TOKEN, and TIKTOK_SHOP_CIPHER.",
    );
  }
  const path = "/product/202309/products/search";
  const body = JSON.stringify({ page_size: 20, status: "ACTIVATE" });
  const params: Record<string, string> = {
    app_key: creds.appKey,
    shop_cipher: creds.shopCipher,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  params.sign = signShopRequest(path, params, body, creds.appSecret);
  const url = new URL(SHOP_HOST + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-tts-access-token": creds.accessToken,
    },
    body,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`TikTok Shop returned HTTP ${response.status}. No live products were filled in.`);
  }
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const products = Array.isArray(data?.products) ? data.products : [];
  const fetchedAt = new Date().toISOString();
  return products.map((item, index) => {
    const record = asRecord(item) ?? {};
    const id = asString(record.id) ?? `tiktok-${index + 1}`;
    const name = asString(record.title) ?? asString(record.name) ?? `TikTok Shop product ${index + 1}`;
    const priceRecord = asRecord(record.price);
    const price = asNumber(priceRecord?.amount) ?? asNumber(record.sale_price) ?? asNumber(record.price);
    const units = asNumber(record.units_sold) ?? asNumber(record.sold_count);
    const reviews = asNumber(record.review_count);
    const rating = asNumber(record.rating);
    return {
      id,
      name,
      category: asString(record.category_name) ?? "Uncategorized",
      offer: asString(record.description)?.slice(0, 180) ?? "",
      retailUsd: figure(price, "live", fetchedAt, price === null ? "TikTok Shop did not return a price" : "TikTok Shop price"),
      unitsSold7d: figure(units, "live", fetchedAt, units === null ? "TikTok Shop did not return units" : "TikTok Shop units"),
      categoryUnits7d: figure<number>(null, "live", fetchedAt, "TikTok Shop product search did not return category velocity"),
      reviewCount: figure(reviews, "live", fetchedAt, reviews === null ? "TikTok Shop did not return reviews" : "TikTok Shop reviews"),
      rating: figure(rating, "live", fetchedAt, rating === null ? "TikTok Shop did not return a rating" : "TikTok Shop rating"),
      creatorViews: figure<number>(null, "live", fetchedAt, "Creator views come from the creator account, not this product call"),
      alibabaUnitUsd: figure<number>(null, "live", fetchedAt, "Alibaba cost is a separate lookup"),
      alibabaUrl: null,
      temuUnitUsd: figure<number>(null, "live", fetchedAt, "Temu cost is entered or looked up separately"),
      temuUrl: null,
      shippingUsd: figure<number>(null, "live", fetchedAt, "Shipping was not returned by TikTok Shop"),
    } satisfies CatalogProduct;
  });
}

export async function fetchCreatorVideos(fetchImpl: typeof fetch = fetch): Promise<{ id: string; title: string; views: number | null }[]> {
  const check = requireEnv(["TIKTOK_ACCESS_TOKEN"]);
  if (!check.ok) {
    throw new Error("TikTok creator is not connected. Set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_ACCESS_TOKEN.");
  }
  const url = new URL(`${CREATOR_HOST}/v2/video/list/`);
  url.searchParams.set("fields", "id,title,view_count");
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${check.values.TIKTOK_ACCESS_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ max_count: 20 }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`TikTok creator video list returned HTTP ${response.status}.`);
  }
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const videos = Array.isArray(data?.videos) ? data.videos : [];
  return videos.map((item, index) => {
    const record = asRecord(item) ?? {};
    return {
      id: asString(record.id) ?? `video-${index + 1}`,
      title: asString(record.title) ?? "Untitled video",
      views: asNumber(record.view_count),
    };
  });
}

export type FacelessPost = {
  productId: string;
  title: string;
  onScreenText: string[];
  voiceover: string;
  caption: string;
  hashtags: string[];
  privacyLevel: "SELF_ONLY";
  camera: "no person on camera";
};

export function facelessPost(product: { id: string; name: string; offer: string }): FacelessPost {
  const offer = product.offer.trim() || "Show the product in use.";
  return {
    productId: product.id,
    title: product.name.slice(0, 80),
    onScreenText: [
      `Stop scrolling if you need a ${product.name.toLowerCase()}`,
      offer,
      "Shop the link",
    ],
    voiceover: `No face, no presenter. Open on the ${product.name}. ${offer} End on the product and the shop link. Do not show a person.`,
    caption: `${product.name}. ${offer} Faceless demo. Modeled research figures are not live sales.`,
    hashtags: ["#tiktokshop", "#faceless", "#productdemo"],
    privacyLevel: "SELF_ONLY",
    camera: "no person on camera",
  };
}

export async function publishFacelessPost(
  post: FacelessPost,
  videoUrl: string | null,
  fetchImpl: typeof fetch = fetch,
): Promise<{ status: "draft_uploaded" | "not_sent"; publishId: string | null; detail: string }> {
  if (!videoUrl) {
    return {
      status: "not_sent",
      publishId: null,
      detail: "TikTok Content Posting needs a video URL. The faceless package is ready, and nothing was sent.",
    };
  }
  const check = requireEnv(["TIKTOK_ACCESS_TOKEN"]);
  if (!check.ok) {
    throw new Error("TikTok creator is not connected. The post was not sent.");
  }
  const mode = process.env.TIKTOK_POST_MODE === "direct" ? "video" : "inbox/video";
  const response = await fetchImpl(`${CREATOR_HOST}/v2/post/publish/${mode}/init/`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${check.values.TIKTOK_ACCESS_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: post.caption.slice(0, 150),
        privacy_level: post.privacyLevel,
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`TikTok posting returned HTTP ${response.status}. Nothing was marked as published.`);
  }
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const publishId = asString(data?.publish_id);
  return {
    status: "draft_uploaded",
    publishId,
    detail:
      mode === "video"
        ? "TikTok accepted a direct publish init. Check the creator account for the post."
        : "TikTok accepted an inbox upload. The video lands as a draft if the app is not audited for public posting.",
  };
}
