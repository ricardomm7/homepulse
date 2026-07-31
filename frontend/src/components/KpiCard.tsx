import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | ReactNode;
  subtitle?: string;
  icon: ReactNode;
  statusColor?: "green" | "red" | "orange" | "neutral";
  progress?: number;
}

export function KpiCard({ title, value, subtitle, icon, statusColor = "neutral", progress }: KpiCardProps) {
  const colorStyles = {
    green: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5",
    red: "text-rose-500 border-rose-500/20 bg-rose-500/5",
    orange: "text-orange-500 border-orange-500/20 bg-orange-500/5",
    neutral: "text-white border-white/10 bg-white/5",
  };

  const ringColors = {
    green: "text-emerald-400",
    red: "text-rose-500",
    orange: "text-orange-500",
    neutral: "text-white/20",
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border backdrop-blur-md p-6 flex flex-col justify-between gap-4 transition-all hover:bg-white/10", colorStyles[statusColor])}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        
        <div className="relative w-12 h-12 flex items-center justify-center">
          {progress !== undefined && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className={ringColors[statusColor]}
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            </svg>
          )}
          <div className="z-10">{icon}</div>
        </div>
      </div>
    </div>
  );
}
