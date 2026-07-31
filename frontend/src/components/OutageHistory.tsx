import { format, parseISO } from "date-fns";

export function OutageHistory({ outages }: { outages: any[] }) {
  if (!outages || outages.length === 0) return null;

  return (
    <div className="mt-6 border border-rose-500/20 bg-rose-500/5 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="text-lg font-bold text-rose-500 mb-4">Histórico de Cortes de Energia</h3>
      <div className="space-y-3">
        {outages.map((outage) => (
          <div key={outage.id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-white">
                Corte em {format(parseISO(outage.start_time + "Z"), "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-slate-400">
                {format(parseISO(outage.start_time + "Z"), "HH:mm")} até {outage.end_time ? format(parseISO(outage.end_time + "Z"), "HH:mm") : "Agora"}
              </p>
            </div>
            <div className="text-right">
              {outage.duration_minutes ? (
                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs font-bold">
                  {Math.round(outage.duration_minutes)} min
                </span>
              ) : (
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold animate-pulse">
                  Em curso
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
