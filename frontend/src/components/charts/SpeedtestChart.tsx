"use client"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

export function SpeedtestChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-48 flex items-center justify-center text-slate-500">A aguardar speedtests...</div>;

  const chartData = [...data].reverse().map(d => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm")
  }));

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
          <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
          />
          <Area type="monotone" dataKey="download_mbps" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorDown)" name="Download (Mbps)" isAnimationActive={false} />
          <Area type="monotone" dataKey="upload_mbps" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorUp)" name="Upload (Mbps)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
