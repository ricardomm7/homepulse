import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header({ isOnline }: { isOnline: boolean }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-6 mb-8 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <Activity className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">HomePulse</h1>
          <p className="text-sm text-slate-400">Server & Network Telemetry</p>
        </div>
      </div>
      
      <div className="flex items-center self-start sm:self-auto gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
        <span className="text-xs font-medium text-slate-300">System Status</span>
        <div className="relative flex h-3 w-3">
          {isOnline && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span className={cn("relative inline-flex rounded-full h-3 w-3", isOnline ? "bg-emerald-500" : "bg-rose-500")}></span>
        </div>
      </div>
    </header>
  );
}
