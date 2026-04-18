# InsForge + OKX x402

[x402](https://web3.okx.com/onchainos/dev-docs/payments/x402-introduction) is an HTTP payment protocol that lets servers monetize any endpoint by returning a `402 Payment Required` challenge that clients satisfy with a signed stablecoin authorization. This example uses [OKX](https://web3.okx.com/onchainos/dev-portal) as the x402 facilitator (settles USDG on X Layer with zero gas) and InsForge for the realtime payment dashboard.

This is a Next.js demo where `/api/report` sells an AI-generated crypto market analysis for `0.000001 USDG` per request. Users connect a wallet, sign an EIP-3009 `transferWithAuthorization`, and receive the paid content plus an on-chain tx hash. A live dashboard streams every payment as it arrives.

- [Live Demo](https://okx.insforge.site)
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/payment/okx-x402)
- [x402 Protocol Docs](https://web3.okx.com/onchainos/dev-docs/payments/x402-introduction)

## Run This Example

### Step 1: Prerequisites

- An [InsForge](https://insforge.dev) project
- An [OKX](https://www.okx.com) account (for Web3 Dev Portal)
- An EVM-compatible wallet (e.g. [OKX Wallet](https://www.okx.com/web3) or MetaMask) with an address on X Layer

### Step 2: Clone and Install

```bash
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/payment/okx-x402
npm install
cp .env.example .env
```

### Step 3: Set Up Your InsForge Project

Create a project in the [InsForge dashboard](https://insforge.dev) and link it:

```bash
npx @insforge/cli link --project-id <your-project-id>
```

Get your **InsForge URL**, **Anon Key**, and **Service Role Key** from **Project Settings** → **API Keys** in the dashboard.

### Step 4: Create an OKX Web3 API Key

The OKX x402 facilitator uses the **Web3 / Onchain OS API**, which is separate from the OKX exchange trading API. Do NOT reuse an exchange API key — it will return `Invalid Authority` (code 50114).

1. Go to the [OKX Onchain OS Dev Portal](https://web3.okx.com/onchainos/dev-portal) and connect your wallet
2. Create a project and link your email + phone number (required to enable API key creation)
3. Click **Create API Key** and set a passphrase of your choice
4. Save the **API Key**, **Secret Key**, and **passphrase** — the secret is shown only once

### Step 5: Initialize the Database

Apply the schema to your InsForge database:

```bash
npx @insforge/cli db import migrations/db_init.sql
```

This creates the `x402_payments` table with a realtime channel trigger so the dashboard updates live on every payment.

### Step 6: Configure Environment Variables

Fill in `.env`:

```env
# OKX Web3 API credentials (from Step 4)
OKX_API_KEY=your-web3-api-key
OKX_SECRET_KEY=your-secret-key
OKX_PASSPHRASE=your-passphrase

# Your wallet address to receive payments (0x... on X Layer)
PAYMENT_RECIPIENT=0xYourWalletAddress

# InsForge (from Step 3)
NEXT_PUBLIC_INSFORGE_URL=https://your-appkey.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
INSFORGE_SERVICE_KEY=your-service-role-key

# Demo mode — bypass real on-chain settlement (remove or set "false" for production)
MOCK_OKX_FACILITATOR=true
```

> **`MOCK_OKX_FACILITATOR=true`** skips the OKX facilitator calls and returns mock `isValid: true` / `txHash: 0x…` responses, so you can exercise the full 402 → sign → report flow without holding USDG. Remove this line (or set to `false`) when you have real USDG on X Layer and want to settle on-chain.

### Step 7: Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Try it** on the endpoint card, then **Confirm Payment**, and sign with your wallet. A live payment row flashes into the dashboard below.

> **Note**: To settle real payments on mainnet, fund the paying wallet with USDG on X Layer and set `MOCK_OKX_FACILITATOR=false`. The OKX facilitator covers gas — the wallet only needs USDG.

## How It Works

The client calls `POST /api/report`. The server replies `402 Payment Required` with a challenge describing the network (`eip155:196`), asset (USDG at `0x4ae46a50…`), amount, and recipient.

The wallet signs an EIP-3009 `TransferWithAuthorization` using the USDG token's EIP-712 domain (`name: "Global Dollar", version: "1"`). The client re-sends the request with a `PAYMENT-SIGNATURE` header. The server forwards the payload to the OKX facilitator's `/verify` and `/settle` endpoints; on success it records the payment in `x402_payments` and returns the AI-generated report plus a `PAYMENT-RESPONSE` header containing the tx hash.

The dashboard subscribes to the `x402_payments` realtime channel and renders every insert live, with aggregate stats and a sparkline of recent revenue.
