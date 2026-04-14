# OKX x402 Pay-per-use API Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js app that demonstrates pay-per-use API monetization with OKX x402 and InsForge, with a realtime dashboard.

**Architecture:** Next.js API Routes handle x402 payment gating. OKX facilitator API verifies and settles payments. InsForge stores payment records and streams them to a realtime dashboard via WebSocket.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, @insforge/sdk, TypeScript

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `payment/okx-x402/package.json`
- Create: `payment/okx-x402/tsconfig.json`
- Create: `payment/okx-x402/next.config.ts`
- Create: `payment/okx-x402/tailwind.config.ts`
- Create: `payment/okx-x402/postcss.config.mjs`
- Create: `payment/okx-x402/.env.example`
- Create: `payment/okx-x402/.gitignore`
- Create: `payment/okx-x402/src/app/globals.css`
- Create: `payment/okx-x402/src/app/layout.tsx`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "okx-x402-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@insforge/sdk": "^1.2.2",
    "next": "^15.5.7",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@types/node": "^24.9.2",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.21.0",
    "eslint-config-next": "^15.2.2",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: Create postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 6: Create .env.example**

```env
# OKX API Credentials
OKX_API_KEY=your-api-key
OKX_API_SECRET=your-secret-key
OKX_API_PASSPHRASE=your-passphrase

# Your wallet address to receive payments
PAYMENT_RECIPIENT=0xYourWalletAddress

# InsForge
NEXT_PUBLIC_INSFORGE_URL=https://your-appkey.us-east.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
INSFORGE_SERVICE_KEY=your-service-role-key
```

- [ ] **Step 7: Create .gitignore**

```
node_modules
.next
.env
.env.local
```

- [ ] **Step 8: Create src/app/globals.css**

Copy the exact CSS from `auth/auth0/src/app/globals.css` — same CSS variable theme system with light/dark support.

- [ ] **Step 9: Create src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

const themeInitScript = `
(() => {
  try {
    const storageKey = "insforge-theme";
    const savedTheme = localStorage.getItem(storageKey) || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolvedTheme = savedTheme === "system"
      ? (prefersDark ? "dark" : "light")
      : savedTheme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: "x402 Payment Demo",
  description: "Pay-per-use API demo with OKX x402 and InsForge",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Install dependencies and verify**

```bash
cd payment/okx-x402 && npm install
```

- [ ] **Step 11: Commit**

```bash
git add payment/okx-x402/
git commit -m "feat(payment): scaffold okx-x402 Next.js project"
```

---

### Task 2: InsForge Client and x402 Utilities

**Files:**
- Create: `payment/okx-x402/src/lib/insforge.ts`
- Create: `payment/okx-x402/src/lib/okx-facilitator.ts`
- Create: `payment/okx-x402/src/lib/x402.ts`

- [ ] **Step 1: Create src/lib/insforge.ts**

Two clients: one server-side with service key (for writes), one client-side with anon key (for reads and realtime).

```typescript
import { createClient } from "@insforge/sdk";

// Server-side client with service key (for writing payment records)
export function createServiceClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.INSFORGE_SERVICE_KEY!,
  });
}

// Client-side client with anon key (for reads and realtime)
export function createBrowserClient() {
  return createClient({
    baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
    anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
  });
}
```

- [ ] **Step 2: Create src/lib/okx-facilitator.ts**

```typescript
import crypto from "crypto";

const OKX_BASE = "https://web3.okx.com/api/v6/x402";

function signOKX(
  timestamp: string,
  method: string,
  path: string,
  body: string
): string {
  const prehash = timestamp + method + path + body;
  return crypto
    .createHmac("sha256", process.env.OKX_API_SECRET!)
    .update(prehash)
    .digest("base64");
}

function okxHeaders(method: string, path: string, body: string) {
  const timestamp = new Date().toISOString();
  return {
    "OK-ACCESS-KEY": process.env.OKX_API_KEY!,
    "OK-ACCESS-SIGN": signOKX(timestamp, method, path, body),
    "OK-ACCESS-PASSPHRASE": process.env.OKX_API_PASSPHRASE!,
    "OK-ACCESS-TIMESTAMP": timestamp,
    "Content-Type": "application/json",
  };
}

export async function verifyPayment(
  paymentPayload: unknown,
  paymentRequirements: unknown
) {
  const path = "/api/v6/x402/verify";
  const body = JSON.stringify({
    x402Version: 1,
    paymentPayload,
    paymentRequirements,
  });

  const res = await fetch(OKX_BASE + "/verify", {
    method: "POST",
    headers: okxHeaders("POST", path, body),
    body,
  });

  const json = await res.json();
  return json.data?.[0] ?? { isValid: false };
}

export async function settlePayment(
  paymentPayload: unknown,
  paymentRequirements: unknown
) {
  const path = "/api/v6/x402/settle";
  const body = JSON.stringify({
    x402Version: 1,
    chainIndex: "196",
    syncSettle: true,
    paymentPayload,
    paymentRequirements,
  });

  const res = await fetch(OKX_BASE + "/settle", {
    method: "POST",
    headers: okxHeaders("POST", path, body),
    body,
  });

  const json = await res.json();
  return json.data?.[0] ?? { success: false };
}
```

- [ ] **Step 3: Create src/lib/x402.ts**

```typescript
// USDG on X Layer
const ASSET = "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8";

export function buildPaymentRequirements(endpointUrl: string) {
  return {
    scheme: "exact",
    maxAmountRequired: "1000", // 0.001 USDG (6 decimals)
    resource: endpointUrl,
    description: "Premium API endpoint — Crypto Market Report",
    mimeType: "application/json",
    payTo: process.env.PAYMENT_RECIPIENT!,
    maxTimeoutSeconds: 300,
    asset: ASSET,
    extra: { name: "USDG", version: "2" },
  };
}

export function build402Response(paymentRequirements: ReturnType<typeof buildPaymentRequirements>) {
  const challenge = {
    x402Version: 1,
    accepts: [
      {
        network: "eip155:196",
        ...paymentRequirements,
      },
    ],
  };

  return new Response(JSON.stringify({ error: "Payment required" }), {
    status: 402,
    headers: {
      "Content-Type": "application/json",
      "PAYMENT-REQUIRED": btoa(JSON.stringify(challenge)),
    },
  });
}

export function decodePaymentSignature(header: string): unknown {
  return JSON.parse(atob(header));
}

export function buildPaymentResponseHeader(settlement: {
  txHash: string;
  payer: string;
}) {
  return btoa(
    JSON.stringify({
      success: true,
      transaction: settlement.txHash,
      network: "eip155:196",
      payer: settlement.payer,
    })
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add payment/okx-x402/src/lib/
git commit -m "feat(payment): add InsForge client, OKX facilitator, and x402 utils"
```

---

### Task 3: x402-Protected Report Endpoint

**Files:**
- Create: `payment/okx-x402/src/app/api/report/route.ts`

- [ ] **Step 1: Create the report API route**

```typescript
import { NextRequest } from "next/server";
import { verifyPayment, settlePayment } from "@/lib/okx-facilitator";
import { createServiceClient } from "@/lib/insforge";
import {
  buildPaymentRequirements,
  build402Response,
  decodePaymentSignature,
  buildPaymentResponseHeader,
} from "@/lib/x402";

function generateMockReport() {
  const assets = [
    { symbol: "BTC", price: 84521.3 + Math.random() * 1000, change_24h: +(Math.random() * 6 - 2).toFixed(1), signal: "bullish" },
    { symbol: "ETH", price: 1632.15 + Math.random() * 100, change_24h: +(Math.random() * 6 - 3).toFixed(1), signal: "neutral" },
    { symbol: "SOL", price: 131.42 + Math.random() * 20, change_24h: +(Math.random() * 8 - 2).toFixed(1), signal: "bullish" },
    { symbol: "AVAX", price: 22.18 + Math.random() * 5, change_24h: +(Math.random() * 10 - 4).toFixed(1), signal: "bearish" },
    { symbol: "LINK", price: 14.72 + Math.random() * 3, change_24h: +(Math.random() * 7 - 3).toFixed(1), signal: "neutral" },
  ];

  return {
    title: "Crypto Market Analysis",
    generated_at: new Date().toISOString(),
    assets,
    summary: `Market shows ${assets.filter(a => a.signal === "bullish").length > 2 ? "moderate bullish" : "mixed"} momentum. BTC leads with strong volume. ETH consolidating near support. Altcoin sector showing selective strength in L1 tokens.`,
  };
}

export async function POST(req: NextRequest) {
  const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const paymentRequirements = buildPaymentRequirements(`${baseUrl}/api/report`);

  // Check for payment signature
  const paymentSigHeader = req.headers.get("X-PAYMENT-SIGNATURE");

  if (!paymentSigHeader) {
    return build402Response(paymentRequirements);
  }

  // Decode and verify payment
  let paymentPayload: unknown;
  try {
    paymentPayload = decodePaymentSignature(paymentSigHeader);
  } catch {
    return Response.json({ error: "Invalid payment signature encoding" }, { status: 400 });
  }

  const verification = await verifyPayment(paymentPayload, paymentRequirements);
  if (!verification.isValid) {
    return Response.json(
      { error: "Payment invalid", reason: verification.invalidReason },
      { status: 402 }
    );
  }

  // Settle payment on-chain
  const settlement = await settlePayment(paymentPayload, paymentRequirements);
  if (!settlement.success) {
    return Response.json(
      { error: "Settlement failed", reason: settlement.errorReason },
      { status: 500 }
    );
  }

  // Record payment in InsForge
  const insforge = createServiceClient();
  await insforge.database.from("x402_payments").insert([{
    payer_address: settlement.payer,
    endpoint: "/api/report",
    amount: paymentRequirements.maxAmountRequired,
    tx_hash: settlement.txHash,
    status: "settled",
    response_summary: "Crypto Market Analysis report",
  }]);

  // Generate and return report
  const report = generateMockReport();

  return Response.json(
    {
      report,
      payment: {
        tx_hash: settlement.txHash,
        payer: settlement.payer,
        amount: "0.001 USDG",
      },
    },
    {
      status: 200,
      headers: {
        "PAYMENT-RESPONSE": buildPaymentResponseHeader(settlement),
      },
    }
  );
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
cd payment/okx-x402 && npx next build
```

Expected: Build succeeds (route compiles). It won't work at runtime without env vars, but compilation should pass.

- [ ] **Step 3: Commit**

```bash
git add payment/okx-x402/src/app/api/report/
git commit -m "feat(payment): add x402-protected report endpoint"
```

---

### Task 4: Payments Query Endpoint

**Files:**
- Create: `payment/okx-x402/src/app/api/payments/route.ts`

- [ ] **Step 1: Create the payments API route**

```typescript
import { createServiceClient } from "@/lib/insforge";

export async function GET() {
  const insforge = createServiceClient();

  // Get latest 50 records
  const { data: payments, error } = await insforge.database
    .from("x402_payments")
    .select()
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get aggregate stats
  const { data: allPayments } = await insforge.database
    .from("x402_payments")
    .select("amount");

  const totalRequests = allPayments?.length ?? 0;
  const totalRevenue = allPayments
    ? allPayments.reduce((sum: number, p: { amount: string }) => sum + Number(p.amount), 0)
    : 0;

  return Response.json({
    payments: payments ?? [],
    stats: {
      totalRequests,
      totalRevenue, // in raw units (divide by 1e6 for USDG)
      latestPayment: payments?.[0]?.created_at ?? null,
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/src/app/api/payments/
git commit -m "feat(payment): add payments query endpoint"
```

---

### Task 5: ThemeSwitcher Component

**Files:**
- Create: `payment/okx-x402/src/components/theme-switcher.tsx`

- [ ] **Step 1: Copy ThemeSwitcher from auth/auth0**

Copy the file exactly from `auth/auth0/src/components/theme-switcher.tsx`. It's a self-contained component with no external dependencies beyond React.

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/src/components/theme-switcher.tsx
git commit -m "feat(payment): add theme switcher component"
```

---

### Task 6: Stats Cards Component

**Files:**
- Create: `payment/okx-x402/src/components/stats-cards.tsx`

- [ ] **Step 1: Create the stats cards component**

```tsx
"use client";

interface StatsCardsProps {
  totalRequests: number;
  totalRevenue: number; // raw units
  latestPayment: string | null;
}

export function StatsCards({ totalRequests, totalRevenue, latestPayment }: StatsCardsProps) {
  const revenueDisplay = (totalRevenue / 1e6).toFixed(4);
  const latestDisplay = latestPayment
    ? new Date(latestPayment).toLocaleString()
    : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          Total Requests
        </p>
        <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
          {totalRequests}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          Total Revenue
        </p>
        <p className="mt-2 text-3xl font-bold text-[var(--foreground)]">
          {revenueDisplay} <span className="text-base font-normal text-[var(--muted-foreground)]">USDG</span>
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
          Latest Payment
        </p>
        <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
          {latestDisplay}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/src/components/stats-cards.tsx
git commit -m "feat(payment): add stats cards component"
```

---

### Task 7: Payment Log Component

**Files:**
- Create: `payment/okx-x402/src/components/payment-log.tsx`

- [ ] **Step 1: Create the payment log table component**

```tsx
"use client";

interface Payment {
  id: number;
  payer_address: string;
  endpoint: string;
  amount: string;
  tx_hash: string;
  chain: string;
  status: string;
  response_summary: string | null;
  created_at: string;
}

interface PaymentLogProps {
  payments: Payment[];
}

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string) {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

export function PaymentLog({ payments }: PaymentLogProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          No payments yet. Use the API endpoint to trigger a payment.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Time</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Payer</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Endpoint</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Amount</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Tx Hash</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b border-[var(--border)] last:border-0">
              <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap">
                {new Date(payment.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">
                {truncateAddress(payment.payer_address)}
              </td>
              <td className="px-4 py-3 font-mono text-[var(--foreground)]">
                {payment.endpoint}
              </td>
              <td className="px-4 py-3 text-[var(--foreground)]">
                {(Number(payment.amount) / 1e6).toFixed(4)} USDG
              </td>
              <td className="px-4 py-3">
                <a
                  href={`https://www.okx.com/web3/explorer/xlayer/tx/${payment.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-500 hover:underline"
                >
                  {truncateHash(payment.tx_hash)}
                </a>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  payment.status === "settled"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {payment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/src/components/payment-log.tsx
git commit -m "feat(payment): add payment log table component"
```

---

### Task 8: Dashboard Page with Realtime

**Files:**
- Create: `payment/okx-x402/src/components/dashboard.tsx`
- Create: `payment/okx-x402/src/app/page.tsx`

- [ ] **Step 1: Create src/components/dashboard.tsx**

This is the client component that handles data fetching and realtime subscription.

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/insforge";
import { StatsCards } from "./stats-cards";
import { PaymentLog } from "./payment-log";

interface Payment {
  id: number;
  payer_address: string;
  endpoint: string;
  amount: string;
  tx_hash: string;
  chain: string;
  status: string;
  response_summary: string | null;
  created_at: string;
}

interface Stats {
  totalRequests: number;
  totalRevenue: number;
  latestPayment: string | null;
}

export function Dashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRequests: 0,
    totalRevenue: 0,
    latestPayment: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    const res = await fetch("/api/payments");
    if (res.ok) {
      const data = await res.json();
      setPayments(data.payments);
      setStats(data.stats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Realtime subscription
  useEffect(() => {
    const insforge = createBrowserClient();
    let mounted = true;

    async function setupRealtime() {
      await insforge.realtime.connect();
      await insforge.realtime.subscribe("x402_payments");

      insforge.realtime.on("INSERT_x402_payments", (payload: { new: Payment }) => {
        if (!mounted) return;
        const newPayment = payload.new;

        setPayments((prev) => [newPayment, ...prev].slice(0, 50));
        setStats((prev) => ({
          totalRequests: prev.totalRequests + 1,
          totalRevenue: prev.totalRevenue + Number(newPayment.amount),
          latestPayment: newPayment.created_at,
        }));
      });
    }

    setupRealtime();

    return () => {
      mounted = false;
      insforge.realtime.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <StatsCards
        totalRequests={stats.totalRequests}
        totalRevenue={stats.totalRevenue}
        latestPayment={stats.latestPayment}
      />
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
          Payment Log
        </h2>
        <PaymentLog payments={payments} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/app/page.tsx**

```tsx
import { Dashboard } from "@/components/dashboard";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              x402 Payment Dashboard
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Pay-per-use API demo with OKX x402 and InsForge
            </p>
          </div>
          <ThemeSwitcher />
        </div>

        <Dashboard />

        {/* API Try-it Section */}
        <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Try the API
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            Call the premium endpoint to generate a crypto market report. The endpoint
            uses the x402 protocol — first request returns a 402 payment challenge,
            then you pay with USDG on X Layer and retry with the payment signature.
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                1. Get payment challenge
              </p>
              <pre className="rounded-md bg-[var(--surface-muted)] border border-[var(--border)] p-3 text-sm font-mono text-[var(--foreground)] overflow-x-auto">
{`curl -X POST http://localhost:3000/api/report`}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1">
                2. Pay and retry (with x402 client)
              </p>
              <pre className="rounded-md bg-[var(--surface-muted)] border border-[var(--border)] p-3 text-sm font-mono text-[var(--foreground)] overflow-x-auto">
{`import { wrapFetchWithPayment } from "@x402/fetch";

const response = await fetchWithPayment(
  "http://localhost:3000/api/report",
  { method: "POST" }
);
const data = await response.json();`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
cd payment/okx-x402 && npx next build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add payment/okx-x402/src/components/dashboard.tsx payment/okx-x402/src/app/page.tsx
git commit -m "feat(payment): add dashboard page with realtime updates"
```

---

### Task 9: Database Setup SQL

**Files:**
- Create: `payment/okx-x402/sql/setup.sql`

- [ ] **Step 1: Create the SQL setup file**

```sql
-- x402 Payment Records
-- Run this against your InsForge database before starting the app

create table if not exists x402_payments (
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

-- Indexes
create index if not exists idx_x402_payments_payer on x402_payments (payer_address);
create index if not exists idx_x402_payments_created on x402_payments (created_at desc);

-- Enable realtime for live dashboard
-- Create channel pattern for realtime
INSERT INTO realtime.channels (pattern, description, enabled)
VALUES ('x402_payments', 'Payment events for dashboard', true)
ON CONFLICT DO NOTHING;

-- Trigger to publish INSERT events to realtime
CREATE OR REPLACE FUNCTION notify_x402_payment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.publish(
    'x402_payments',
    'INSERT_x402_payments',
    jsonb_build_object(
      'new', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER x402_payment_realtime
  AFTER INSERT ON x402_payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_x402_payment();
```

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/sql/
git commit -m "feat(payment): add database setup SQL for x402_payments"
```

---

### Task 10: README for the Demo

**Files:**
- Create: `payment/okx-x402/README.md`

- [ ] **Step 1: Create README.md**

```markdown
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
| `OKX_API_SECRET` | OKX API secret |
| `OKX_API_PASSPHRASE` | OKX API passphrase |
| `PAYMENT_RECIPIENT` | Your wallet address to receive payments |
| `NEXT_PUBLIC_INSFORGE_URL` | InsForge project URL |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | InsForge anon key |
| `INSFORGE_SERVICE_KEY` | InsForge service role key |

### 3. Set up the database

Run the SQL in `sql/setup.sql` against your InsForge database:

```bash
npx @insforge/cli db query --file sql/setup.sql
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

const signer = privateKeyToAccount(process.env.PRIVATE_KEY as \`0x\${string}\`);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const response = await fetchWithPayment("http://localhost:3000/api/report", {
  method: "POST",
});
const data = await response.json();
console.log(data);
```
```

- [ ] **Step 2: Commit**

```bash
git add payment/okx-x402/README.md
git commit -m "docs(payment): add README for okx-x402 demo"
```

---

### Task 11: Update Repo README

**Files:**
- Modify: `README.md` (repo root)

- [ ] **Step 1: Add Payment section to the integrations table**

After the Auth table in `README.md`, add:

```markdown
### Payment

| Integration | Framework | Demo | Guide |
| --- | --- | --- | --- |
| [`okx-x402`](./payment/okx-x402) | Next.js | [x402pay.insforge.site](https://x402pay.insforge.site) | [Guide](https://insforge.dev/integrations/okx-x402) |
```

- [ ] **Step 2: Update Repository Structure section**

Change the structure to include payment:

```text
insforge-integration/
├── auth/
│   ├── auth0/
│   ├── clerk/
│   ├── kinde/
│   ├── stytch/
│   └── workos/
└── payment/
    └── okx-x402/
```

- [ ] **Step 3: Add payment README link to Per-Integration Documentation**

Add:
```markdown
- [`payment/okx-x402/README.md`](./payment/okx-x402/README.md)
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add okx-x402 payment integration to README"
```

---

### Task 12: Update Content System Tutorial

**Files:**
- Modify: `/Users/carmen/Desktop/Github/insforge-content-management-system/integrations/okx-x402.md`

- [ ] **Step 1: Update frontmatter status**

Change `status: "staging"` to `status: "published"`.

- [ ] **Step 2: Add Full Demo section after Step 7**

Append after the "## Key Details" section:

```markdown
## Full Demo: Next.js Dashboard App

A complete working demo showing a pay-per-use API with a realtime dashboard is available in the InsForge integration repository.

**What it includes:**
- A premium API endpoint (`POST /api/report`) that returns crypto market analysis behind x402 payment gating
- Full OKX facilitator integration (verify + settle)
- Payment record storage in InsForge PostgreSQL
- A realtime dashboard showing request counts, revenue, and a live payment log

- [Live Demo](https://x402pay.insforge.site) — Try it live
- [Source Code](https://github.com/InsForge/insforge-integration/tree/main/payment/okx-x402) — GitHub repository

### Quick Start

```bash
# Clone the repo
git clone https://github.com/InsForge/insforge-integration.git
cd insforge-integration/payment/okx-x402

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env.local

# Set up the database
npx @insforge/cli db query --file sql/setup.sql

# Start the dev server
npm run dev
```

See the [demo README](https://github.com/InsForge/insforge-integration/tree/main/payment/okx-x402/README.md) for full setup instructions and how to call the paid API with the `@x402/fetch` client.
```

- [ ] **Step 3: Commit (in the content system repo)**

```bash
cd /Users/carmen/Desktop/Github/insforge-content-management-system
git add integrations/okx-x402.md
git commit -m "docs: add full demo section and publish okx-x402 guide"
```

---
