import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}

export function MetricCard({
  label,
  value,
  delta,
  description,
  icon: Icon,
  accent,
}: MetricCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-[22px] border-white/[0.07] bg-[linear-gradient(145deg,rgba(14,27,39,0.94),rgba(8,17,27,0.8))] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.12]">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 text-slate-400">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] shadow-[0_0_20px_-12px_currentColor]",
                accent
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {label}
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
        </div>

        {delta ? (
          <span className="shrink-0 rounded-full border border-emerald-300/12 bg-emerald-300/[0.07] px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
            {delta}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
