import type { ConnectionState } from "./types";

function read(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function requireEnv(names: string[]): { ok: true; values: Record<string, string> } | { ok: false; missing: string[] } {
  const missing = names.filter((name) => read(name) === null);
  if (missing.length > 0) return { ok: false, missing };
  const values: Record<string, string> = {};
  for (const name of names) {
    const value = read(name);
    if (value) values[name] = value;
  }
  return { ok: true, values };
}

const TIKTOK_SHOP = [
  "TIKTOK_SHOP_APP_KEY",
  "TIKTOK_SHOP_APP_SECRET",
  "TIKTOK_SHOP_ACCESS_TOKEN",
  "TIKTOK_SHOP_CIPHER",
] as const;

const TIKTOK_CREATOR = ["TIKTOK_CLIENT_KEY", "TIKTOK_CLIENT_SECRET", "TIKTOK_ACCESS_TOKEN"] as const;

const SHOPIFY = ["SHOPIFY_SHOP_DOMAIN", "SHOPIFY_ADMIN_TOKEN"] as const;

const META = ["META_AD_ACCOUNT_ID", "META_ACCESS_TOKEN", "META_PAGE_ID", "META_DAILY_BUDGET_CAP"] as const;

const ALIBABA = ["ALIBABA_APP_KEY", "ALIBABA_APP_SECRET", "ALIBABA_ACCESS_TOKEN"] as const;

const TEMU = ["TEMU_APP_KEY", "TEMU_APP_SECRET", "TEMU_ACCESS_TOKEN"] as const;

export function connectionStatus(): ConnectionState[] {
  const groups: Array<{ name: ConnectionState["name"]; label: string; keys: readonly string[] }> = [
    { name: "tiktokShop", label: "TikTok Shop", keys: TIKTOK_SHOP },
    { name: "tiktokCreator", label: "TikTok creator", keys: TIKTOK_CREATOR },
    { name: "shopify", label: "Shopify", keys: SHOPIFY },
    { name: "meta", label: "Meta ads", keys: META },
    { name: "alibaba", label: "Alibaba", keys: ALIBABA },
    { name: "temu", label: "Temu seller", keys: TEMU },
  ];
  return groups.map((group) => {
    const check = requireEnv([...group.keys]);
    return {
      name: group.name,
      label: group.label,
      connected: check.ok,
      missing: check.ok ? [] : check.missing,
    };
  });
}

export function budgetCapUsd(): number | null {
  const raw = read("META_DAILY_BUDGET_CAP");
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function shopifyShopDomain(): string | null {
  const domain = read("SHOPIFY_SHOP_DOMAIN");
  if (!domain) return null;
  return domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
