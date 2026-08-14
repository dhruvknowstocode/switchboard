# Folio Demo App

Magazine-style consumer app controlled by **Switchboard** feature flags via `@switchboard/sdk`.

## Run

```bash
# From repo root (API must already be running on :4000)
npm run prisma:push
npm run prisma:seed
npm run build:sdk
npm run dev:demo
```

Open http://localhost:3001

## Flags used

| Key | What it does in Folio |
|-----|------------------------|
| `folio-hero-v2` | Classic vs redesigned hero |
| `folio-audio-mode` | Show Listen button |
| `folio-member-gate` | Soft membership CTA |

Change them in Switchboard (`localhost:3000`) → Feature Flags, then click **Re-evaluate** in Folio.

## Auth

Uses seeded demo API key:

`sb_live_folio_demo_key_local_only_0001`
