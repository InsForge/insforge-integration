"use client";

import { Sparkline } from "./sparkline";
import { formatRelativeTime } from "@/lib/format-time";

interface StatsCardsProps {
  totalRequests: number;
  totalRevenue: number;
  latestPayment: string | null;
  latestPayer: string | null;
  recentAmounts: number[];
}

function truncateAddress(addr: string | null) {
  if (!addr || addr.length <= 12) return addr || "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function IconChip({ color, children }: { color: "amber" | "emerald" | "blue"; children: React.ReactNode }) {
  const bg = {
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }[color];
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${bg}`}>
      {children}
    </span>
  );
}

const cardClass = "rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none";
const labelClass = "text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide";

export function StatsCards({
  totalRequests,
  totalRevenue,
  latestPayment,
  latestPayer,
  recentAmounts,
}: StatsCardsProps) {
  const revenueDisplay = (totalRevenue / 1e6).toFixed(6);
  const latestRelative = latestPayment ? formatRelativeTime(latestPayment) : "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-2">
          <p className={labelClass}>Total Requests</p>
          <IconChip color="amber">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </IconChip>
        </div>
        <p className="text-3xl font-bold text-[var(--foreground)]">
          {totalRequests}
        </p>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-2">
          <p className={labelClass}>Total Revenue</p>
          <IconChip color="emerald">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </IconChip>
        </div>
        <p className="text-3xl font-bold text-[var(--foreground)]">
          {revenueDisplay} <span className="text-base font-normal text-[var(--muted-foreground)]">USDG</span>
        </p>
        <div className="mt-3">
          <Sparkline values={recentAmounts} height={18} />
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex items-center justify-between mb-2">
          <p className={labelClass}>Latest Payment</p>
          <IconChip color="blue">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </IconChip>
        </div>
        <p className="text-lg font-semibold text-[var(--foreground)]">
          {latestRelative}
        </p>
        <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">
          {truncateAddress(latestPayer)}
        </p>
      </div>
    </div>
  );
}
