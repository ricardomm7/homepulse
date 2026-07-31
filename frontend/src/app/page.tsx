"use client"
import { useDashboardData } from "@/hooks/useDashboardData";
import { Header } from "@/components/Header";
import { KpiCard } from "@/components/KpiCard";
import { NetworkChart } from "@/components/charts/NetworkChart";
import { SpeedtestChart } from "@/components/charts/SpeedtestChart";
import { PowerChart } from "@/components/charts/PowerChart";
import { OutageHistory } from "@/components/OutageHistory";
import { Battery, BatteryWarning, Globe, Wifi, ActivitySquare, AlertTriangle, Zap, Server } from "lucide-react";

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
    return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-emerald-400 font-mono tracking-widest">
      <span className="animate-pulse">[ INIT_HOME_PULSE ]</span>
    </div>;
  }

  // Derived states
  const isServerOnline = !!health && health.status === "ok";
  const batteryPct = powerLatest?.battery_percent !== null && powerLatest?.battery_percent !== undefined ? Math.round(powerLatest?.battery_percent) : undefined;
  const isPluggedIn = powerLatest?.is_plugged_in;
  const lastDown = speedtestLatest?.download_mbps ? speedtestLatest.download_mbps.toFixed(1) : "---";
  const lastUp = speedtestLatest?.upload_mbps ? speedtestLatest.upload_mbps.toFixed(1) : "---";
  const isNetworkOk = networkHistory && networkHistory.length > 0 ? networkHistory[0].status : false;
  
  // Has ongoing outage?
  const hasOngoingOutage = outages && outages.length > 0 && !outages[0].end_time;

  return (
    <div className="min-h-screen bg-black text-slate-50 p-4 md:p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <Header isOnline={isServerOnline} />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <KpiCard 
            title="BAT_LEVEL" 
            value={batteryPct !== undefined ? `${batteryPct}%` : "N/A"} 
            subtitle={isPluggedIn === null ? "SENSOR_UNAVAILABLE" : (isPluggedIn ? "AC_POWER: ON" : "AC_POWER: OFF")}
            icon={isPluggedIn === null ? <BatteryWarning className="text-orange-500" /> : (isPluggedIn ? <Zap className="text-emerald-400" /> : <BatteryWarning className="text-rose-500" />)}
            statusColor={isPluggedIn === null ? "orange" : (isPluggedIn ? "green" : (batteryPct && batteryPct < 20 ? "red" : "orange"))}
            progress={batteryPct}
          />

          <KpiCard 
            title="GRID_STATUS" 
            value={isPluggedIn === null ? "UNKNOWN" : (hasOngoingOutage ? "OUTAGE" : "ONLINE")} 
            subtitle={isPluggedIn === null ? "DOCKER_WSL_LIMITATION" : (hasOngoingOutage ? "RUNNING_ON_BATTERY" : "GRID_STABLE")}
            icon={hasOngoingOutage ? <AlertTriangle className="text-rose-500" /> : <ActivitySquare className={isPluggedIn === null ? "text-slate-500" : "text-emerald-400"} />}
            statusColor={isPluggedIn === null ? "neutral" : (hasOngoingOutage ? "red" : "green")}
          />

          <KpiCard 
            title="NET_CONNECTIVITY" 
            value={isNetworkOk ? "ONLINE" : "FAIL"} 
            subtitle={`IFACE: ${health?.active_interface || "N/A"} [${health?.interface_speed_mbps || 0}Mbps]`}
            icon={<Globe className={isNetworkOk ? "text-emerald-400" : "text-rose-500"} />}
            statusColor={isNetworkOk ? "green" : "red"}
          />

          <KpiCard 
            title="LAST_SPEEDTEST" 
            value={`${lastDown}/${lastUp}`} 
            subtitle="DL/UL (MBPS)"
            icon={<Wifi className="text-blue-400" />}
            statusColor="neutral"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          
          {/* Main Power Chart takes 2 columns on desktop */}
          <div className="lg:col-span-2 border border-white/20 bg-white/5 rounded-none p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b border-white/10 gap-2">
              <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-white flex items-center gap-2">
                <Battery className="w-4 h-4 text-emerald-400" /> 
                PWR_TELEMETRY
              </h2>
              {powerLatest?.voltage && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-1 rounded-none">
                  V_OUT: {powerLatest.voltage.toFixed(2)}V | PWR: {powerLatest.wattage?.toFixed(2) || 0}W
                </span>
              )}
            </div>
            <PowerChart data={powerHistory} outages={outages} />
          </div>

          {/* Network side */}
          <div className="space-y-6 flex flex-col">
            <div className="border border-white/20 bg-white/5 rounded-none p-6 flex-1">
               <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-white flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Globe className="w-4 h-4 text-blue-400" /> 
                PING_STABILITY
              </h2>
              <NetworkChart data={networkHistory} />
            </div>

            <div className="border border-white/20 bg-white/5 rounded-none p-6 flex-1">
               <h2 className="text-sm font-bold uppercase tracking-widest font-mono text-white flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Wifi className="w-4 h-4 text-purple-400" /> 
                NET_THROUGHPUT
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
