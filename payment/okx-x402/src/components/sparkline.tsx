"use client";

interface SparklineProps {
  values: number[];
  height?: number;
  className?: string;
}

export function Sparkline({ values, height = 20, className = "" }: SparklineProps) {
  if (values.length === 0) {
    return <div style={{ height }} className={className} aria-hidden />;
  }

  const max = Math.max(...values, 1);
  const barCount = values.length;
  const barGap = 2;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      style={{ height }}
      aria-hidden
    >
      {values.map((v, i) => {
        const barWidth = (100 - barGap * (barCount - 1)) / barCount;
        const x = i * (barWidth + barGap);
        const h = Math.max(2, (v / max) * height);
        const y = height - h;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={1}
            className="fill-emerald-500/70"
          />
        );
      })}
    </svg>
  );
}
