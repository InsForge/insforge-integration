"use client";

import { formatRelativeTime } from "@/lib/format-time";

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

interface PaymentLogProps {
  payments: Payment[];
  newIds?: Set<string>;
}

function truncateAddress(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function truncateHash(hash: string) {
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
}

export function PaymentLog({ payments, newIds }: PaymentLogProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--muted-foreground)]">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h2" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">No payments yet</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Trigger the API endpoint above to see payment records appear in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-x-auto shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none">
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
          {payments.map((payment) => {
            const isNew = newIds?.has(payment.id);
            return (
              <tr
                key={payment.id}
                className={`border-b border-[var(--border)] last:border-0 transition-colors duration-700 ${
                  isNew ? "bg-emerald-500/10" : ""
                }`}
              >
                <td className="px-4 py-3 text-[var(--foreground)] whitespace-nowrap" title={new Date(payment.created_at).toLocaleString()}>
                  {formatRelativeTime(payment.created_at)}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--muted-foreground)]">
                  {truncateAddress(payment.payer_address)}
                </td>
                <td className="px-4 py-3 font-mono text-[var(--foreground)]">
                  {payment.endpoint}
                </td>
                <td className="px-4 py-3 text-[var(--foreground)]">
                  {(Number(payment.amount) / 1e6).toFixed(6)} USDG
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--foreground)]">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                      payment.status === "settled" ? "bg-emerald-500" : "bg-red-500"
                    }`} />
                    {payment.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
