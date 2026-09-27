# Keel

Launch desk for tiktokseller2. The eve agent and the browser desk share one pipeline: TikTok Shop and creator reads, ranking, supplier costs, Shopify publish, faceless TikTok packages, and paused Meta campaigns.

The starter catalog is modeled data dated 21 Sep 2026. It is not live TikTok, Temu, Alibaba, Shopify, or Meta data.

## Run

```bash
npm install
npm test
npm run dev
```

The desk is at `/`. Chat with the agent at `/chat`.

`npm run dev:eve` starts the eve session server. Shopify publish, TikTok upload, and Meta writes each wait for approval.

## Credentials

Copy `.env.example` to `.env.local`. A missing group leaves that connection marked "Not connected" and the live step returns an error instead of modeled numbers.
