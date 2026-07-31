"use client"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceArea } from "recharts";
import { format, parseISO } from "date-fns";

export function PowerChart({ data, outages }: { data: any[], outages: any[] }) {
  if (!data || data.length === 0) return <div className="h-72 flex items-center justify-center text-slate-500">A aguardar dados...</div>;

  const chartData = [...data].reverse().map(d => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm")
  }));

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            stroke="#475569" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={30}
          />
          <YAxis 
            stroke="#475569" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          
          {outages?.map((outage, i) => {
            const startStr = format(parseISO(outage.start_time + "Z"), "HH:mm");
            const endStr = outage.end_time ? format(parseISO(outage.end_time + "Z"), "HH:mm") : chartData[chartData.length-1]?.time;
            return (
              <ReferenceArea 
                key={i} 
                x1={startStr} 
                x2={endStr} 
                strokeOpacity={0.3} 
                fill="#f43f5e" 
                fillOpacity={0.1} 
              />
            );
          })}

          <Area 
            type="monotone" 
            dataKey="battery_percent" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorBattery)" 
            name="Battery %"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
