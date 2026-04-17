"use client";

interface StatsCardsProps {
  totalRequests: number;
  totalRevenue: number;
  latestPayment: string | null;
}

export function StatsCards({ totalRequests, totalRevenue, latestPayment }: StatsCardsProps) {
  const revenueDisplay = (totalRevenue / 1e6).toFixed(6);
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
