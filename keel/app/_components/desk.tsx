"use client";

import { useState } from "react";

import {
  confirmMetaActivation,
  confirmMetaDraft,
  confirmShopify,
  confirmTikTok,
  previewMeta,
  previewPosts,
  previewShopify,
  rankLoaded,
  showCatalog,
  showCreatorVideos,
} from "@/app/desk-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MetaPlan } from "@/lib/keel/meta";
import type { ShopifyPayload } from "@/lib/keel/shopify";
import type { FacelessPost } from "@/lib/keel/tiktok";
import type { CatalogKind, CatalogProduct, ConnectionState, RankedProduct } from "@/lib/keel/types";
import { MODELED_DISCLAIMER } from "@/lib/keel/types";

function money(value: number | null): string {
  return value === null ? "—" : `$${value.toFixed(2)}`;
}

function share(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export function Desk({ connections }: { readonly connections: ConnectionState[] }) {
  const [kind, setKind] = useState<CatalogKind | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[] | null>(null);
  const [ranked, setRanked] = useState<RankedProduct[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [shopify, setShopify] = useState<ShopifyPayload | null>(null);
  const [posts, setPosts] = useState<FacelessPost[] | null>(null);
  const [plan, setPlan] = useState<MetaPlan | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [approved, setApproved] = useState(false);
  const [notice, setNotice] = useState("No catalog loaded.");
  const [busy, setBusy] = useState(false);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const metaProduct = selected[0] ?? ranked?.[0]?.id ?? "";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">tiktokseller2</p>
          <h1 className="text-3xl font-semibold tracking-tight">Keel</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Rank products from your TikTok accounts, compare supplier costs, publish a Shopify catalog, draft faceless posts, and keep Meta spend paused until you approve it.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/chat">Talk to Keel</a>
        </Button>
      </header>

      <section className="rounded-xl border bg-card p-5" data-section="connections">
        <h2 className="text-lg font-medium">Connections</h2>
        <p className="mt-1 text-sm text-muted-foreground">Credentials stay in environment variables. Missing keys stop the live step.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {connections.map((connection) => (
            <li key={connection.name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
              <span>{connection.label}</span>
              <Badge variant={connection.connected ? "default" : "outline"}>
                {connection.connected ? "Connected" : "Not connected"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <p className="rounded-lg border bg-card px-4 py-3 text-sm" role="status">
        {notice}
      </p>

      <section className="rounded-xl border bg-card p-5" data-section="catalog">
        <h2 className="text-lg font-medium">Catalog</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await showCatalog("modeled");
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setKind(result.kind);
                setDisclaimer(result.disclaimer);
                setProducts(result.products);
                setRanked(null);
                setSelected([]);
                setShopify(null);
                setPosts(null);
                setPlan(null);
                setNotice(result.disclaimer ?? "Catalog loaded.");
              })
            }
            type="button"
          >
            Show modeled starter catalog
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await showCatalog("live");
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setKind("live");
                setDisclaimer(null);
                setProducts(result.products);
                setRanked(null);
                setNotice(`Loaded ${result.products.length} live TikTok Shop products.`);
              })
            }
            type="button"
            variant="outline"
          >
            Load TikTok Shop
          </Button>
          <Button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const result = await showCreatorVideos();
                setNotice(result.ok ? `Creator account returned ${result.videos.length} videos.` : result.error);
              })
            }
            type="button"
            variant="outline"
          >
            Load creator videos
          </Button>
        </div>
        {disclaimer ? <p className="mt-4 text-sm">{disclaimer}</p> : null}
        {products === null ? <p className="mt-4 text-sm text-muted-foreground">No catalog loaded.</p> : null}
        {products && products.length === 0 ? <p className="mt-4 text-sm">TikTok Shop returned no products.</p> : null}
        {products && products.length > 0 ? (
          <ul className="mt-4 divide-y">
            {products.map((product) => (
              <li key={product.id} className="flex items-baseline justify-between gap-4 py-3 text-sm">
                <span>
                  <span className="font-medium">{product.name}</span>
                  <span className="mt-1 block text-muted-foreground">{product.offer}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {money(product.retailUsd.value)} · {product.retailUsd.source}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-5" data-section="rank">
        <h2 className="text-lg font-medium">Ranked shortlist</h2>
        <Button
          className="mt-4"
          disabled={busy || products === null}
          onClick={() =>
            run(async () => {
              if (!products || !kind) return;
              const next = await rankLoaded(products);
              setRanked(next);
              setSelected(next.slice(0, 2).map((product) => product.id));
              setNotice("Shortlist ranked. Market share stays empty when category velocity is missing.");
            })
          }
          type="button"
        >
          Rank shortlist
        </Button>
        {ranked ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3 font-medium">Use</th>
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Share</th>
                  <th className="py-2 pr-3 font-medium">Margin</th>
                  <th className="py-2 font-medium">Break-even ROAS</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((product) => (
                  <tr key={product.id} className="border-t">
                    <td className="py-2 pr-3">
                      <input
                        aria-label={`Select ${product.name}`}
                        checked={selected.includes(product.id)}
                        onChange={() => toggle(product.id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="py-2 pr-3">{product.name}</td>
                    <td className="py-2 pr-3">{product.score ?? "—"}</td>
                    <td className="py-2 pr-3">
                      {share(product.marketShare.value)}
                      <span className="block text-xs text-muted-foreground">{product.marketShare.source}</span>
                    </td>
                    <td className="py-2 pr-3">{money(product.unitEconomics.contributionMarginUsd.value)}</td>
                    <td className="py-2">
                      {product.unitEconomics.breakEvenRoas.value ?? "—"}
                      <span className="block text-xs text-muted-foreground">model, not a live result</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-5" data-section="shopify">
        <h2 className="text-lg font-medium">Shopify catalog</h2>
        <p className="mt-1 text-sm text-muted-foreground">Preview the products, collection, and storefront page. Publishing writes to the connected shop only after you confirm.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={busy || ranked === null}
            onClick={() =>
              run(async () => {
                if (!ranked || !kind) return;
                const result = await previewShopify(ranked, selected, kind);
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setShopify(result.payload);
                setNotice("Shopify payload ready. It is not published yet.");
              })
            }
            type="button"
          >
            Preview Shopify payload
          </Button>
          <Button
            disabled={busy || shopify === null}
            onClick={() =>
              run(async () => {
                if (!ranked || !kind) return;
                const result = await confirmShopify(ranked, selected, kind);
                setNotice(result.ok ? `Shopify published ${result.result.productIds.length} products.` : result.error);
              })
            }
            type="button"
            variant="outline"
          >
            Confirm Shopify publish
          </Button>
        </div>
        {shopify ? (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(shopify, null, 2)}</pre>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-5" data-section="tiktok">
        <h2 className="text-lg font-medium">Faceless TikTok posts</h2>
        <p className="mt-1 text-sm text-muted-foreground">No person on camera. A video URL is required before anything is sent. Without one, the package stays on this desk.</p>
        <label className="mt-4 block text-sm" htmlFor="video-url">
          Video URL
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2"
            id="video-url"
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="https://example.com/demo.mp4"
            value={videoUrl}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={busy || ranked === null}
            onClick={() =>
              run(async () => {
                if (!ranked) return;
                const result = await previewPosts(ranked, selected);
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setPosts(result.posts);
                setNotice("Faceless packages ready. Nothing has been sent to TikTok.");
              })
            }
            type="button"
          >
            Preview faceless posts
          </Button>
          <Button
            disabled={busy || posts === null}
            onClick={() =>
              run(async () => {
                if (!ranked) return;
                const result = await confirmTikTok(ranked, selected, videoUrl);
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                const sent = result.results.filter((item) => item.result.status === "draft_uploaded").length;
                setNotice(sent === 0 ? result.results[0]?.result.detail ?? "Nothing was sent." : `TikTok accepted ${sent} upload${sent === 1 ? "" : "s"}.`);
              })
            }
            type="button"
            variant="outline"
          >
            Confirm TikTok upload
          </Button>
        </div>
        {posts ? (
          <ul className="mt-4 space-y-3 text-sm">
            {posts.map((post) => (
              <li key={post.productId} className="rounded-lg border p-3">
                <p className="font-medium">{post.title}</p>
                <p className="mt-1 text-muted-foreground">{post.camera}</p>
                <ol className="mt-2 list-decimal pl-5">
                  {post.onScreenText.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
                <p className="mt-2">{post.caption}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="rounded-xl border bg-card p-5" data-section="meta">
        <h2 className="text-lg font-medium">Meta plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Campaigns are created paused. Activation needs this approval and META_DAILY_BUDGET_CAP. Break-even ROAS is a model.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={busy || ranked === null}
            onClick={() =>
              run(async () => {
                if (!ranked || !kind) return;
                const result = await previewMeta(ranked, metaProduct, kind);
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setPlan(result.plan);
                setNotice("Paused Meta plan ready. No campaign has been created.");
              })
            }
            type="button"
          >
            Preview paused Meta plan
          </Button>
          <Button
            disabled={busy || plan === null}
            onClick={() =>
              run(async () => {
                if (!ranked || !kind) return;
                const result = await confirmMetaDraft(ranked, metaProduct, kind);
                if (!result.ok) {
                  setNotice(result.error);
                  return;
                }
                setCampaignId(result.draft.campaignId ?? "");
                setNotice(`Meta campaign created with status ${result.draft.status}.`);
              })
            }
            type="button"
            variant="outline"
          >
            Create paused campaign
          </Button>
        </div>
        {plan ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{plan.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Daily budget</dt>
              <dd>{money(plan.dailyBudgetUsd)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Break-even ROAS</dt>
              <dd>{plan.breakEvenRoas ?? "—"} · model</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Note</dt>
              <dd>{plan.disclaimer}</dd>
            </div>
          </dl>
        ) : null}
        <label className="mt-4 flex items-center gap-2 text-sm" htmlFor="approve-spend">
          <input
            checked={approved}
            id="approve-spend"
            onChange={(event) => setApproved(event.target.checked)}
            type="checkbox"
          />
          I approve this Meta spend
        </label>
        <Button
          className="mt-3"
          disabled={busy || !approved || plan === null}
          onClick={() =>
            run(async () => {
              const result = await confirmMetaActivation(campaignId, plan?.dailyBudgetUsd ?? 0, approved);
              setNotice(result.ok ? `Campaign ${result.result.campaignId} is ${result.result.status}.` : result.error);
            })
          }
          type="button"
          variant="destructive"
        >
          Activate campaign
        </Button>
      </section>
      <p className="text-xs text-muted-foreground">{MODELED_DISCLAIMER}</p>
    </main>
  );
}
