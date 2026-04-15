# x402 Client-Side Payment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser wallet payment to the API Playground so users can complete the full x402 flow (request → pay → receive data).

**Architecture:** New client-side module `x402-client.ts` handles wallet connection and EIP-3009 signing via `viem`. The existing `api-playground.tsx` gains a state machine that shows payment details inline on 402 and retries with a signed payload after wallet confirmation.

**Tech Stack:** viem, Next.js 15, React 19, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/x402-client.ts` | Wallet connection, chain switching, EIP-3009 signing, payload encoding |
| Modify | `src/components/api-playground.tsx` | State machine, payment confirmation UI, retry with signature |
| Modify | `package.json` | Add `viem` dependency |

---

### Task 1: Install viem

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install viem**

Run:
```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
npm install viem
```

Expected: `viem` added to `dependencies` in `package.json`.

- [ ] **Step 2: Verify install**

Run:
```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
node -e "require('viem'); console.log('viem OK')"
```

Expected: `viem OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
git add package.json package-lock.json
git commit -m "feat: add viem dependency for wallet integration"
```

---

### Task 2: Create x402-client.ts

**Files:**
- Create: `src/lib/x402-client.ts`

- [ ] **Step 1: Create the x402 client module**

Create `src/lib/x402-client.ts` with the following content:

```typescript
import {
  createWalletClient,
  custom,
  type WalletClient,
  type Address,
  hexToBigInt,
} from "viem";

const X_LAYER_CHAIN = {
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
} as const;

// EIP-3009 transferWithAuthorization typed data
const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

interface PaymentChallenge {
  x402Version: number;
  accepts: Array<{
    network: string;
    scheme: string;
    maxAmountRequired: string;
    resource: string;
    description: string;
    payTo: string;
    maxTimeoutSeconds: number;
    asset: string;
    extra: { name: string; version: string };
  }>;
}

export function decodeChallenge(base64Header: string): PaymentChallenge {
  return JSON.parse(atob(base64Header));
}

export async function connectWallet(): Promise<WalletClient> {
  if (!window.ethereum) {
    throw new Error("NO_WALLET");
  }

  const client = createWalletClient({
    chain: X_LAYER_CHAIN,
    transport: custom(window.ethereum),
  });

  // Request account access
  await client.requestAddresses();

  // Switch to X Layer if needed
  const chainId = await client.getChainId();
  if (chainId !== 196) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xc4" }], // 196 in hex
      });
    } catch (switchError: unknown) {
      // Chain not added — try adding it
      if (
        typeof switchError === "object" &&
        switchError !== null &&
        "code" in switchError &&
        (switchError as { code: number }).code === 4902
      ) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xc4",
              chainName: "X Layer",
              nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
              rpcUrls: ["https://rpc.xlayer.tech"],
              blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  return client;
}

export async function signPayment(
  challenge: PaymentChallenge,
  walletClient: WalletClient
): Promise<string> {
  const accept = challenge.accepts[0];
  const [account] = await walletClient.getAddresses();

  // Random 32-byte nonce
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = ("0x" +
    Array.from(nonceBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;

  const validBefore = BigInt(Math.floor(Date.now() / 1000) + accept.maxTimeoutSeconds);

  const authorization = {
    from: account,
    to: accept.payTo as Address,
    value: hexToBigInt(
      ("0x" + BigInt(accept.maxAmountRequired).toString(16)) as `0x${string}`
    ),
    validAfter: 0n,
    validBefore,
    nonce,
  };

  const signature = await walletClient.signTypedData({
    account,
    domain: {
      name: accept.extra.name,
      version: accept.extra.version,
      chainId: 196,
      verifyingContract: accept.asset as Address,
    },
    types: EIP3009_TYPES,
    primaryType: "TransferWithAuthorization",
    message: authorization,
  });

  const paymentPayload = {
    x402Version: challenge.x402Version,
    scheme: accept.scheme,
    network: accept.network,
    payload: {
      signature,
      authorization: {
        from: account,
        to: accept.payTo,
        value: accept.maxAmountRequired,
        validAfter: "0",
        validBefore: validBefore.toString(),
        nonce,
      },
    },
  };

  return btoa(JSON.stringify(paymentPayload));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to `x402-client.ts`. (There may be pre-existing warnings from other files — that's fine.)

- [ ] **Step 3: Commit**

```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
git add src/lib/x402-client.ts
git commit -m "feat: add x402 client module for wallet connection and EIP-3009 signing"
```

---

### Task 3: Update api-playground.tsx with payment flow

**Files:**
- Modify: `src/components/api-playground.tsx:1-117` (full rewrite of this component)

- [ ] **Step 1: Replace api-playground.tsx with the payment-enabled version**

Replace the entire content of `src/components/api-playground.tsx` with:

```tsx
"use client";

import { useState, useRef } from "react";
import type { WalletClient } from "viem";
import { connectWallet, decodeChallenge, signPayment } from "@/lib/x402-client";

interface Endpoint {
  name: string;
  description: string;
  method: string;
  path: string;
  price: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    name: "Crypto Market Report",
    description:
      "Generate an AI-powered crypto market analysis with price data, trend signals, and a market summary.",
    method: "POST",
    path: "/api/report",
    price: "0.001 USDG",
  },
];

type FlowState =
  | { step: "idle" }
  | { step: "loading" }
  | { step: "payment_required"; challengeHeader: string; body: unknown }
  | { step: "signing" }
  | { step: "done"; status: number; body: unknown }
  | { step: "error"; message: string };

export function ApiPlayground() {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [flow, setFlow] = useState<FlowState>({ step: "idle" });
  const walletRef = useRef<WalletClient | null>(null);

  async function tryEndpoint(endpoint: Endpoint) {
    setActiveEndpoint(endpoint.path);
    setFlow({ step: "loading" });

    try {
      const res = await fetch(endpoint.path, { method: endpoint.method });
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }

      if (res.status === 402) {
        const challengeHeader = res.headers.get("payment-required");
        if (!challengeHeader) {
          setFlow({ step: "error", message: "Server returned 402 but no payment challenge header" });
          return;
        }
        setFlow({ step: "payment_required", challengeHeader, body });
      } else {
        setFlow({ step: "done", status: res.status, body });
      }
    } catch (err) {
      setFlow({ step: "error", message: String(err) });
    }
  }

  async function confirmPayment(endpoint: Endpoint, challengeHeader: string) {
    setFlow({ step: "signing" });

    try {
      // Connect wallet if not already connected
      if (!walletRef.current) {
        walletRef.current = await connectWallet();
      }

      // Decode challenge and sign payment
      const challenge = decodeChallenge(challengeHeader);
      const paymentSignature = await signPayment(challenge, walletRef.current);

      // Retry request with payment signature
      setFlow({ step: "loading" });
      const res = await fetch(endpoint.path, {
        method: endpoint.method,
        headers: { "X-PAYMENT-SIGNATURE": paymentSignature },
      });

      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }

      setFlow({ step: "done", status: res.status, body });
    } catch (err: unknown) {
      // Reset wallet ref on failure so next attempt reconnects
      walletRef.current = null;

      const message =
        err instanceof Error && err.message === "NO_WALLET"
          ? "Please install MetaMask or OKX Wallet to make payments"
          : `Payment failed: ${err instanceof Error ? err.message : String(err)}`;
      setFlow({ step: "error", message });
    }
  }

  function statusBadgeClass(status: number) {
    if (status === 402)
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    if (status === 200)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
  }

  function statusLabel(status: number) {
    if (status === 402)
      return "Payment Required — complete x402 payment to access this endpoint";
    if (status === 200) return "Success — payment verified, report generated";
    return "Error";
  }

  return (
    <div className="flex flex-col gap-4">
      {ENDPOINTS.map((ep) => (
        <div
          key={ep.path}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center rounded bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-mono font-medium text-[var(--foreground)]">
                  {ep.method}
                </span>
                <span className="text-sm font-mono text-[var(--muted-foreground)]">
                  {ep.path}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--foreground)] mt-2">
                {ep.name}
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                {ep.description}
              </p>
              <p className="text-xs text-[var(--muted-foreground)] mt-2">
                Price:{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  {ep.price}
                </span>{" "}
                per request (USDG on X Layer, zero gas)
              </p>
            </div>
            <button
              onClick={() => tryEndpoint(ep)}
              disabled={flow.step === "loading" || flow.step === "signing"}
              className="flex-shrink-0 rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--surface)] hover:opacity-90 transition disabled:opacity-50"
            >
              {flow.step === "loading" && activeEndpoint === ep.path
                ? "Calling..."
                : "Try it"}
            </button>
          </div>

          {/* Response / Payment area */}
          {activeEndpoint === ep.path && flow.step === "payment_required" && (
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(402)}`}
                >
                  402
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {statusLabel(402)}
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-sm text-[var(--foreground)]">
                  <p className="font-medium mb-2">Payment Details</p>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <span className="text-[var(--muted-foreground)]">Amount:</span>
                    <span className="font-mono">{ep.price}</span>
                    <span className="text-[var(--muted-foreground)]">Network:</span>
                    <span className="font-mono">X Layer (196)</span>
                    <span className="text-[var(--muted-foreground)]">Recipient:</span>
                    <span className="font-mono">
                      {(() => {
                        try {
                          const c = decodeChallenge(flow.challengeHeader);
                          const addr = c.accepts[0]?.payTo ?? "";
                          return addr.slice(0, 6) + "..." + addr.slice(-4);
                        } catch {
                          return "—";
                        }
                      })()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => confirmPayment(ep, flow.challengeHeader)}
                  className="w-full rounded-md bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--surface)] hover:opacity-90 transition"
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          )}

          {activeEndpoint === ep.path && flow.step === "signing" && (
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(402)}`}
                >
                  402
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  Waiting for wallet signature...
                </span>
              </div>
              <div className="p-4 text-sm text-[var(--muted-foreground)] text-center">
                Please confirm the transaction in your wallet
              </div>
            </div>
          )}

          {activeEndpoint === ep.path && flow.step === "done" && (
            <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface-muted)] overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(flow.status)}`}
                >
                  {flow.status}
                </span>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {statusLabel(flow.status)}
                </span>
              </div>
              <pre className="p-3 text-xs font-mono text-[var(--foreground)] overflow-x-auto max-h-80 overflow-y-auto">
                {JSON.stringify(flow.body, null, 2)}
              </pre>
            </div>
          )}

          {activeEndpoint === ep.path && flow.step === "error" && (
            <div className="mt-4 rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 overflow-hidden">
              <div className="p-3 text-sm text-red-800 dark:text-red-400">
                {flow.message}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify the dev server compiles**

Run:
```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No errors related to `api-playground.tsx`.

- [ ] **Step 3: Manual test in browser**

1. Open `http://localhost:3000`
2. Click "Try it" on the Crypto Market Report endpoint
3. Verify: 402 response shows payment details (amount, network, truncated recipient address) and a "Confirm Payment" button
4. Click "Confirm Payment"
5. Verify: MetaMask / OKX Wallet popup appears requesting signature
6. Sign the transaction
7. Verify: 200 response with report data appears (or a clear server error if OKX API keys aren't configured)

- [ ] **Step 4: Test error cases**

1. Click "Confirm Payment" then reject in wallet → verify error message appears, can retry by clicking "Try it" again
2. If testing without wallet extension → verify "Please install MetaMask or OKX Wallet" message

- [ ] **Step 5: Commit**

```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
git add src/components/api-playground.tsx
git commit -m "feat: add wallet payment flow to API Playground"
```

---

### Task 4: Add window.ethereum type declaration

**Files:**
- Create: `src/types/global.d.ts`

This task may be needed if TypeScript complains about `window.ethereum`. Check the output of Task 2/3 type checks first.

- [ ] **Step 1: Create the type declaration**

Create `src/types/global.d.ts`:

```typescript
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

Run:
```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
npx tsc --noEmit --pretty 2>&1 | head -20
```

Expected: No `window.ethereum` type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/carmen/Desktop/Github/insforge-integration/payment/okx-x402
git add src/types/global.d.ts
git commit -m "feat: add window.ethereum type declaration"
```
