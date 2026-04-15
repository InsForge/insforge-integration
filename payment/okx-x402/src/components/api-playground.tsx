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
