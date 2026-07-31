import { format, parseISO } from "date-fns";

export function OutageHistory({ outages }: { outages: any[] }) {
  if (!outages || outages.length === 0) return null;

  return (
    <div className="mt-6 border border-rose-500/30 bg-rose-500/5 rounded-none p-6">
      <h3 className="text-sm font-bold uppercase tracking-widest font-mono text-rose-500 mb-4 border-b border-rose-500/20 pb-2">Histórico de Cortes de Energia</h3>
      <div className="space-y-2">
        {outages.map((outage) => (
          <div key={outage.id} className="flex justify-between items-center p-3 rounded-none bg-black/40 border border-white/10">
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                Corte: {format(parseISO(outage.start_time + "Z"), "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {format(parseISO(outage.start_time + "Z"), "HH:mm")} - {outage.end_time ? format(parseISO(outage.end_time + "Z"), "HH:mm") : "CUR_TIME"}
              </p>
            </div>
            <div className="text-right">
              {outage.duration_minutes ? (
                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 rounded-none border border-rose-500/30 text-xs font-mono font-bold">
                  {Math.round(outage.duration_minutes)} MIN
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-none border border-orange-500/30 text-xs font-mono font-bold animate-pulse">
                  EM_CURSO
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
