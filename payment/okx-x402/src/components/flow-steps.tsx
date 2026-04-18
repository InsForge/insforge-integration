interface Step {
  num: string;
  title: string;
  desc: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    num: "01",
    title: "Request",
    desc: "Client calls gated endpoint. Server returns 402 with payment challenge.",
    accent: "text-amber-600 dark:text-amber-400",
  },
  {
    num: "02",
    title: "Sign",
    desc: "Wallet signs EIP-3009 transferWithAuthorization. Zero gas, one click.",
    accent: "text-blue-600 dark:text-blue-400",
  },
  {
    num: "03",
    title: "Settle",
    desc: "OKX facilitator verifies signature & settles USDG on X Layer.",
    accent: "text-violet-600 dark:text-violet-400",
  },
  {
    num: "04",
    title: "Deliver",
    desc: "Server returns the paid response + on-chain tx hash as proof.",
    accent: "text-emerald-600 dark:text-emerald-400",
  },
];

export function FlowSteps() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            How it works
          </h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            The x402 protocol flow for monetizing any HTTP endpoint.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="relative rounded-md border border-[var(--border)] bg-[var(--surface-muted)] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`font-mono text-[11px] font-semibold ${step.accent}`}>
                {step.num}
              </span>
              {i < STEPS.length - 1 && (
                <svg
                  className="hidden md:block h-3 w-3 text-[var(--muted-foreground)] absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 bg-[var(--background)] rounded-full"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {step.title}
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
