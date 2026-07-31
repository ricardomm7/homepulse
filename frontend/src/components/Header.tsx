import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header({ isOnline }: { isOnline: boolean }) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 mb-8 border-b border-white/20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black border border-white/20 rounded-none">
          <Activity className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-widest text-white uppercase font-mono">HomePulse</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Server & Network Telemetry</p>
        </div>
      </div>
      
      <div className="flex items-center self-start sm:self-auto gap-3 px-4 py-2 bg-black border border-white/20 rounded-none">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">SYS_STATUS</span>
        <div className="relative flex h-3 w-3">
          {isOnline && (
            <span className="animate-pulse absolute inline-flex h-full w-full bg-emerald-400 opacity-75 rounded-none"></span>
          )}
          <span className={cn("relative inline-flex h-3 w-3 rounded-none", isOnline ? "bg-emerald-500" : "bg-rose-500")}></span>
        </div>
      </div>
    </header>
  );
}
