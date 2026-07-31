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
    green: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
    red: "text-rose-500 border-rose-500/30 bg-rose-500/5",
    orange: "text-orange-500 border-orange-500/30 bg-orange-500/5",
    neutral: "text-white border-white/20 bg-white/5",
  };

  const ringColors = {
    green: "text-emerald-400",
    red: "text-rose-500",
    orange: "text-orange-500",
    neutral: "text-white/30",
  };

  return (
    <div className={cn("relative overflow-hidden rounded-none border p-6 flex flex-col justify-between gap-4 transition-colors hover:bg-white/10", colorStyles[statusColor])}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-500">{title}</p>
          <h3 className="text-3xl font-mono tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs font-mono text-slate-400 mt-2">{subtitle}</p>}
        </div>
        
        <div className="relative w-12 h-12 flex items-center justify-center">
          {progress !== undefined && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/5"
                d="M1 18 h34"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <path
                className="text-white/5"
                d="M18 1 v34"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              {/* Replace the smooth circle with a rigid square tracker if needed, or keep the ring but thin. Let's make it a square border progress. */}
            </svg>
          )}
          {/* A simple square progress bar replacement */}
           {progress !== undefined && (
            <div className="absolute inset-0 border border-white/10" style={{
              background: `conic-gradient(from 180deg, currentColor ${progress}%, transparent ${progress}%)`,
              opacity: 0.2
            }} />
          )}
          <div className="z-10">{icon}</div>
        </div>
      </div>
    </div>
  );
}
