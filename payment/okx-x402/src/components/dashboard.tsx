"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
        await insforge.realtime.connect();
        const result = await insforge.realtime.subscribe("x402_payments");
        if (!result?.ok) {
          console.error("[realtime] subscribe failed:", result?.error);
          return;
        }
        if (mounted) setRealtimeConnected(true);

        insforge.realtime.on("INSERT_x402_payments", (payload: { new: Payment }) => {
          if (!mounted) return;
          const newPayment = payload.new;

          setPayments((prev) => [newPayment, ...prev].slice(0, 50));
          setStats((prev) => ({
            totalRequests: prev.totalRequests + 1,
            totalRevenue: prev.totalRevenue + Number(newPayment.amount),
            latestPayment: newPayment.created_at,
          }));

          // Mark the row as new for 2 seconds
          setNewIds((prev) => new Set(prev).add(newPayment.id));
          const existing = timeoutsRef.current.get(newPayment.id);
          if (existing) clearTimeout(existing);
          const t = setTimeout(() => {
            setNewIds((prev) => {
              const next = new Set(prev);
              next.delete(newPayment.id);
              return next;
            });
            timeoutsRef.current.delete(newPayment.id);
          }, 2000);
          timeoutsRef.current.set(newPayment.id, t);
        });
      } catch (err) {
        console.error("[realtime] setup failed:", err);
      }
    }

    setupRealtime();

    const timeouts = timeoutsRef.current;
    return () => {
      mounted = false;
      setRealtimeConnected(false);
      insforge.realtime.disconnect();
      timeouts.forEach((t) => clearTimeout(t));
      timeouts.clear();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted-foreground)]">Loading...</p>
      </div>
    );
  }

  // Last 10 payment amounts, oldest first — for sparkline
  const recentAmounts = payments.slice(0, 10).map((p) => Number(p.amount)).reverse();

  return (
    <div className="flex flex-col gap-6">
      <StatsCards
        totalRequests={stats.totalRequests}
        totalRevenue={stats.totalRevenue}
        latestPayment={stats.latestPayment}
        latestPayer={payments[0]?.payer_address ?? null}
        recentAmounts={recentAmounts}
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
        <PaymentLog payments={payments} newIds={newIds} />
      </div>
    </div>
  );
}
