"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/insforge";
import { StatsCards } from "./stats-cards";
import { PaymentLog } from "./payment-log";

interface Payment {
  id: string;
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
  const [realtimeConnected, setRealtimeConnected] = useState(false);

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
      try {
        console.log("[realtime] connecting...");
        await insforge.realtime.connect();
        console.log("[realtime] connected, subscribing to x402_payments...");
        const result = await insforge.realtime.subscribe("x402_payments");
        console.log("[realtime] subscribe result:", result);
        if (!result?.ok) {
          console.error("[realtime] subscribe failed:", result?.error);
          return;
        }
        if (mounted) setRealtimeConnected(true);

        insforge.realtime.on("INSERT_x402_payments", (payload: { new: Payment }) => {
          console.log("[realtime] INSERT event:", payload);
          if (!mounted) return;
          const newPayment = payload.new;

          setPayments((prev) => [newPayment, ...prev].slice(0, 50));
          setStats((prev) => ({
            totalRequests: prev.totalRequests + 1,
            totalRevenue: prev.totalRevenue + Number(newPayment.amount),
            latestPayment: newPayment.created_at,
          }));
        });
      } catch (err) {
        console.error("[realtime] setup failed:", err);
      }
    }

    setupRealtime();

    return () => {
      mounted = false;
      setRealtimeConnected(false);
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Payment Log
          </h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${
              realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-[var(--muted-foreground)]"
            }`} />
            {realtimeConnected ? "Live" : "Connecting..."}
          </span>
        </div>
        <PaymentLog payments={payments} />
      </div>
    </div>
  );
}
