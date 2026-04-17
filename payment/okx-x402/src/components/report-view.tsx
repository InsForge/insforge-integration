"use client";

import ReactMarkdown from "react-markdown";

interface Asset {
  symbol: string;
  price: number;
  change_24h: number;
  signal: "bullish" | "bearish" | "neutral";
}

interface Report {
  title: string;
  generated_at: string;
  model?: string;
  assets: Asset[];
  analysis: string;
}

interface Payment {
  tx_hash: string;
  payer: string;
  amount: string;
}

interface ReportBody {
  report?: Report;
  payment?: Payment;
}

function signalColor(signal: Asset["signal"]) {
  if (signal === "bullish") return "text-emerald-600 dark:text-emerald-400";
  if (signal === "bearish") return "text-red-600 dark:text-red-400";
  return "text-[var(--muted-foreground)]";
}

function changeColor(change: number) {
  if (change > 0) return "text-emerald-600 dark:text-emerald-400";
  if (change < 0) return "text-red-600 dark:text-red-400";
  return "text-[var(--muted-foreground)]";
}

function truncate(addr: string) {
  if (!addr || addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function downloadJSON(body: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportView({ body }: { body: unknown }) {
  const parsed = body as ReportBody;
  const report = parsed?.report;
  const payment = parsed?.payment;

  if (!report) {
    return (
      <pre className="p-3 text-xs font-mono text-[var(--foreground)] overflow-x-auto max-h-80 overflow-y-auto">
        {JSON.stringify(body, null, 2)}
      </pre>
    );
  }

  const filename = `crypto-report-${new Date(report.generated_at).getTime()}.json`;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            {report.title}
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {new Date(report.generated_at).toLocaleString()}
            {report.model && (
              <span className="ml-2 font-mono">· {report.model}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => downloadJSON(body, filename)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition flex-shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        </button>
      </div>

      {/* Assets table */}
      <div className="rounded-md border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="text-left px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Asset</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Price</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">24h</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">Signal</th>
            </tr>
          </thead>
          <tbody>
            {report.assets.map((asset) => (
              <tr key={asset.symbol} className="border-b border-[var(--border)] last:border-0">
                <td className="px-3 py-2 font-medium text-[var(--foreground)]">
                  {asset.symbol}
                </td>
                <td className="px-3 py-2 text-right font-mono text-[var(--foreground)]">
                  ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`px-3 py-2 text-right font-mono ${changeColor(asset.change_24h)}`}>
                  {asset.change_24h > 0 ? "+" : ""}{asset.change_24h}%
                </td>
                <td className={`px-3 py-2 text-right font-medium capitalize ${signalColor(asset.signal)}`}>
                  {asset.signal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI analysis (markdown) */}
      <div className="prose-report text-sm text-[var(--foreground)] leading-relaxed">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-sm font-semibold text-[var(--foreground)] mt-4 mb-2 first:mt-0">
                {children}
              </h2>
            ),
            p: ({ children }) => (
              <p className="text-sm text-[var(--foreground)] mb-2 last:mb-0">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--foreground)]">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--foreground)]">{children}</ol>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-[var(--muted-foreground)]">{children}</em>
            ),
            code: ({ children }) => (
              <code className="rounded bg-[var(--surface)] px-1 py-0.5 text-xs font-mono">{children}</code>
            ),
          }}
        >
          {report.analysis}
        </ReactMarkdown>
      </div>

      {/* Payment proof */}
      {payment && (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5">
            Payment Proof
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            <span className="text-[var(--muted-foreground)]">Amount:</span>
            <span className="font-mono text-[var(--foreground)]">{payment.amount}</span>
            <span className="text-[var(--muted-foreground)]">Payer:</span>
            <span className="font-mono text-[var(--foreground)]">{truncate(payment.payer)}</span>
            <span className="text-[var(--muted-foreground)]">Tx Hash:</span>
            <span className="font-mono text-[var(--foreground)]">{truncate(payment.tx_hash)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
