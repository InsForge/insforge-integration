import { Dashboard } from "@/components/dashboard";
import { ApiPlayground } from "@/components/api-playground";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { FlowSteps } from "@/components/flow-steps";

export default function Home() {
  const isMock = process.env.MOCK_OKX_FACILITATOR === "true";

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
              Pay-per-use APIs,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-violet-500">
                one signature away.
              </span>
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-3">
              OKX x402 + InsForge · USDG on X Layer · No accounts, no gas.
            </p>
          </div>
          <ThemeSwitcher />
        </div>

        <div className="relative mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-amber-500 to-violet-500" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs pl-2">
            <MetaItem label="Protocol" value="x402 · exact scheme" />
            <MetaItem label="Facilitator" value="OKX" />
            <MetaItem label="Network" value="X Layer (196)" />
            <MetaItem label="Asset" value="USDG" />
            {isMock && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Mock mode
              </span>
            )}
          </div>
        </div>

        <div className="mb-8">
          <FlowSteps />
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">
            Premium API Endpoints
          </h2>
          <ApiPlayground />
        </section>

        <Dashboard />
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span className="font-mono text-[var(--foreground)]">{value}</span>
    </div>
  );
}
