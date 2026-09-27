# tiktokseller2

Keel is the launch desk in [keel](keel/). It ranks products from a connected TikTok Shop and TikTok creator account, compares Alibaba and Temu costs, publishes a Shopify catalog, writes faceless TikTok posts, and sizes a Meta campaign that stays paused until you approve spend.

The starter catalog is modeled data dated 21 Sep 2026. It is not live TikTok, Temu, Alibaba, Shopify, or Meta data. Live calls run only when the matching environment variables are set, and a failed call does not get filled in with those modeled figures.

```bash
cd keel
npm install
npm test
npm run dev
```

Open the desk at `/` and the eve chat at `/chat`. Credential names are listed in [keel/.env.example](keel/.env.example).
