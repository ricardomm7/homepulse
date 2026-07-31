"use client"
import { useDashboardData } from "@/hooks/useDashboardData";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { NetworkChart } from "@/components/charts/NetworkChart";
import { SpeedtestChart } from "@/components/charts/SpeedtestChart";
import { PowerChart } from "@/components/charts/PowerChart";
import { OutageHistory } from "@/components/OutageHistory";
import { Battery, BatteryWarning, Globe, Wifi, ActivitySquare, AlertTriangle, Zap } from "lucide-react";

export default function Dashboard() {
  const { 
    health, 
    powerLatest, 
    powerHistory, 
    outages, 
    networkHistory, 
    speedtestLatest, 
    speedtestHistory, 
    isLoading 
  } = useDashboardData();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 animate-pulse">A iniciar HomePulse...</div>;
  }

  // Derived states
  const isServerOnline = !!health && health.status === "ok";
  const batteryPct = powerLatest?.battery_percent !== null && powerLatest?.battery_percent !== undefined ? Math.round(powerLatest?.battery_percent) : undefined;
  const isPluggedIn = powerLatest?.is_plugged_in;
  const lastDown = speedtestLatest?.download_mbps ? speedtestLatest.download_mbps.toFixed(1) : "--";
  const lastUp = speedtestLatest?.upload_mbps ? speedtestLatest.upload_mbps.toFixed(1) : "--";
  const isNetworkOk = networkHistory && networkHistory.length > 0 ? networkHistory[0].status : false;
  
  // Has ongoing outage?
  const hasOngoingOutage = outages && outages.length > 0 && !outages[0].end_time;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <Header isOnline={isServerOnline} />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <KpiCard 
            title="Estado da Bateria" 
            value={batteryPct !== undefined ? `${batteryPct}%` : "N/A"} 
            subtitle={isPluggedIn ? "A carregar / Ligado à Corrente" : "A descarregar / Bateria"}
            icon={isPluggedIn ? <Zap className="text-emerald-400" /> : <BatteryWarning className="text-rose-500" />}
            statusColor={isPluggedIn ? "green" : (batteryPct && batteryPct < 20 ? "red" : "orange")}
            progress={batteryPct}
          />

          <KpiCard 
            title="Rede Elétrica da Casa" 
            value={hasOngoingOutage ? "CORTE DETETADO" : "ONLINE"} 
            subtitle={hasOngoingOutage ? "O servidor está a usar bateria" : "Energia estabilizada"}
            icon={hasOngoingOutage ? <AlertTriangle className="text-rose-500" /> : <ActivitySquare className="text-emerald-400" />}
            statusColor={hasOngoingOutage ? "red" : "green"}
          />

          <KpiCard 
            title="Conectividade (Ping)" 
            value={isNetworkOk ? "ONLINE" : "FALHA"} 
            subtitle={`Interface: ${health?.active_interface || "N/A"} (${health?.interface_speed_mbps || 0} Mbps)`}
            icon={<Globe className={isNetworkOk ? "text-emerald-400" : "text-rose-500"} />}
            statusColor={isNetworkOk ? "green" : "red"}
          />

          <KpiCard 
            title="Último Speedtest" 
            value={`${lastDown} / ${lastUp}`} 
            subtitle="Download / Upload (Mbps)"
            icon={<Wifi className="text-blue-400" />}
            statusColor="neutral"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Main Power Chart takes 2 columns on desktop */}
          <div className="lg:col-span-2 border border-white/10 bg-white/5 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Battery className="w-5 h-5 text-emerald-400" /> 
                Saúde Energética & Bateria
              </h2>
              {powerLatest?.voltage && (
                <span className="text-xs font-mono text-slate-400 bg-black/20 px-3 py-1 rounded-full">
                  {powerLatest.voltage.toFixed(2)}V | {powerLatest.wattage?.toFixed(2) || 0}W
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-6">Visualização da descarga e cortes de luz (áreas vermelhas indicam cortes).</p>
            <PowerChart data={powerHistory} outages={outages} />
          </div>

          {/* Network side */}
          <div className="space-y-6 flex flex-col">
            <div className="border border-white/10 bg-white/5 rounded-3xl p-6 backdrop-blur-md flex-1">
               <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-400" /> 
                Estabilidade (Ping)
              </h2>
              <NetworkChart data={networkHistory} />
            </div>

            <div className="border border-white/10 bg-white/5 rounded-3xl p-6 backdrop-blur-md flex-1">
               <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4 text-purple-400" /> 
                Desempenho da Rede
              </h2>
              <SpeedtestChart data={speedtestHistory} />
            </div>
          </div>
        </div>

        {/* Outage logs */}
        <OutageHistory outages={outages} />

      </div>
    </div>
  );
}
