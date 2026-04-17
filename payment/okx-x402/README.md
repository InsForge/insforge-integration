# OKX x402 Payment Demo

Pay-per-use API demo with onchain payments via [OKX x402](https://web3.okx.com/onchainos/dev-docs/payments/x402-introduction) and [InsForge](https://insforge.dev).

A premium API endpoint returns crypto market reports. Each request requires payment through the x402 protocol (USDG on X Layer, zero gas). A realtime dashboard displays all payment events and usage metrics.

## Prerequisites

- Node.js 18+
- An [InsForge](https://insforge.dev) project
- An [OKX](https://www.okx.com) account with API credentials

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Description |
|----------|-------------|
| `OKX_API_KEY` | OKX API key |
| `OKX_SECRET_KEY` | OKX API secret |
| `OKX_PASSPHRASE` | OKX API passphrase |
| `PAYMENT_RECIPIENT` | Your wallet address to receive payments |
| `NEXT_PUBLIC_INSFORGE_URL` | InsForge project URL |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | InsForge anon key |
| `INSFORGE_SERVICE_KEY` | InsForge service role key |

### 3. Set up the database

Run the SQL in `migrations/db_init.sql` against your InsForge database:

```bash
npx @insforge/cli db query --file migrations/db_init.sql
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

## API Endpoints

### `POST /api/report` (x402-protected)

Returns a crypto market analysis report. Requires x402 payment.

Without payment signature, returns `402` with payment challenge. With valid payment, returns the report and records the transaction.

### `GET /api/payments`

Returns the latest 50 payment records and aggregate stats.

## Calling the Paid API

Use the `@x402/fetch` client to handle the payment flow automatically:

```bash
npm install @x402/fetch @x402/evm
```

```typescript
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("http://localhost:3000/api/report", {
  method: "POST",
});
const data = await response.json();
console.log(data);
```
