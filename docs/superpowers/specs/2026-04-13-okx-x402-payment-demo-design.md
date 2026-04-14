# OKX x402 Pay-per-use API Demo - Design Spec

## Overview

A Next.js app demonstrating pay-per-use API monetization using the x402 protocol with OKX facilitator and InsForge backend. Users call a premium API endpoint, pay via x402 onchain flow, and a realtime dashboard displays all payment/usage events.

## Tech Stack

- Next.js 15 + React 19 + Tailwind 3
- @insforge/sdk for database + realtime
- OKX x402 facilitator API for payment verify/settle
- TypeScript throughout

## Project Structure

```
payment/okx-x402/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                # Dashboard
│   │   └── api/
│   │       ├── report/route.ts     # x402-protected endpoint
│   │       └── payments/route.ts   # Query payment records
│   ├── lib/
│   │   ├── okx-facilitator.ts      # OKX verify/settle
│   │   ├── insforge.ts             # InsForge client (service key)
│   │   └── x402.ts                 # x402 challenge/header utils
│   └── components/
│       ├── dashboard.tsx           # Main dashboard component
│       ├── payment-log.tsx         # Realtime payment table
│       ├── stats-cards.tsx         # Stats cards
│       └── theme-switcher.tsx      # Theme toggle
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
└── .env.example
```

## Database

Single table, no RLS (public dashboard). Service key writes, anonymous reads.

```sql
create table x402_payments (
  id bigint generated always as identity primary key,
  payer_address text not null,
  endpoint text not null,
  amount text not null,
  tx_hash text not null,
  chain text default 'xlayer',
  status text default 'settled',
  response_summary text,
  created_at timestamptz default now()
);

create index idx_x402_payments_payer on x402_payments (payer_address);
create index idx_x402_payments_created on x402_payments (created_at desc);

alter publication insforge_realtime add table x402_payments;
```

## API Endpoints

### POST /api/report (x402-protected)

1. Check for `X-PAYMENT-SIGNATURE` header
2. No header → return 402 + `PAYMENT-REQUIRED` header (base64 challenge JSON)
3. Has header → decode → OKX verify → OKX settle → generate mock report → insert into x402_payments → return report + payment info

Payment challenge:
- Network: X Layer (chain ID 196)
- Token: USDG
- Amount: 0.001 USDG (1000 in 6-decimal units)
- Scheme: exact

Mock report response:
```json
{
  "report": {
    "title": "Crypto Market Analysis",
    "generated_at": "...",
    "assets": [
      { "symbol": "BTC", "price": 84521.30, "change_24h": 2.4, "signal": "bullish" },
      { "symbol": "ETH", "price": 1632.15, "change_24h": -1.2, "signal": "neutral" },
      { "symbol": "SOL", "price": 131.42, "change_24h": 5.7, "signal": "bullish" }
    ],
    "summary": "Market shows moderate bullish momentum..."
  },
  "payment": {
    "tx_hash": "0x...",
    "payer": "0x...",
    "amount": "0.001 USDG"
  }
}
```

### GET /api/payments

Returns latest 50 payment records + aggregate stats (total count, total amount).

## Dashboard Frontend

Single page with three sections:

1. **Stats Cards** (3): Total Requests, Total Revenue (USDG), Latest Payment time
2. **Payment Log Table**: Time, Payer (truncated), Endpoint, Amount, Tx Hash (links to block explorer), Status. Initial load via GET /api/payments, then InsForge Realtime subscription on x402_payments INSERT events. New records prepend, stats update live.
3. **API Try-it Section**: Shows curl examples, endpoint URL, x402 flow explanation.

Theme: Reuse repo CSS variable system (light/dark) with ThemeSwitcher.

## Content System Update

Update `insforge-content-management-system/integrations/okx-x402.md`:
- Add "Full Demo: Next.js Dashboard App" section after Step 7
- Include: demo intro, clone/run instructions, env setup, DB setup, core code walkthrough
- Link to source at `insforge-integration/payment/okx-x402`
- Update frontmatter status from "staging" to "published"

Update repo `README.md`:
- Add Payment category to Integrations table
- Add OKX x402 entry
