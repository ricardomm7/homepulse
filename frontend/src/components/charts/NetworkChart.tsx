"use client"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

export function NetworkChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500">A aguardar pings...</div>;

  const chartData = [...data].reverse().map(d => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm:ss"),
    ping: d.status ? 1 : 0
  }));

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
          <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1.5]} hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(val: number) => [val === 1 ? 'Online' : 'Offline', 'Status']}
          />
          <Line 
            type="stepAfter" 
            dataKey="ping" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
