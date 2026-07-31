"use client"
import { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { format, parseISO } from "date-fns";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ReferenceArea, Brush } from "recharts";
import { Battery, BatteryWarning, Globe, Wifi, ActivitySquare, AlertTriangle, Zap, Server, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

// Chart Configs
const powerChartConfig = {
  battery_normal: { label: "Battery", color: "#22c55e" },
  battery_outage: { label: "Discharging", color: "#f97316" },
} satisfies ChartConfig;

const networkChartConfig = {
  ping: { label: "Uptime", color: "#3b82f6" },
} satisfies ChartConfig;

const speedtestChartConfig = {
  download: { label: "Download", color: "#0ea5e9" },
  upload: { label: "Upload", color: "#8b5cf6" },
} satisfies ChartConfig;

export default function Dashboard() {
  const { health, powerLatest, powerHistory, outages, networkHistory, speedtestLatest, speedtestHistory, isLoading } = useDashboardData();
  const [outagePage, setOutagePage] = useState(1);
  const itemsPerPage = 10;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <ActivitySquare className="h-8 w-8 animate-pulse text-muted-foreground" />
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Awaiting telemetry...</p>
        </div>
      </div>
    );
  }

  // Derived states
  const isServerOnline = !!health && health.status === "ok";
  const batteryPct = powerLatest?.battery_percent !== null && powerLatest?.battery_percent !== undefined ? Math.round(powerLatest?.battery_percent) : undefined;
  const isPluggedIn = powerLatest?.is_plugged_in;
  const hasOngoingOutage = outages && outages.length > 0 && !outages[0].end_time;
  const isNetworkOk = networkHistory && networkHistory.length > 0 ? networkHistory[0].status : false;

  // Pagination Logic
  const totalOutages = outages?.length || 0;
  const totalOutagePages = Math.max(1, Math.ceil(totalOutages / itemsPerPage));
  const paginatedOutages = outages?.slice((outagePage - 1) * itemsPerPage, outagePage * itemsPerPage) || [];

  // Chart Mappers
  const powerChartData = [...(powerHistory || [])].reverse().map((d, i, arr) => {
    const isOutage = d.is_plugged_in === 0 || d.is_plugged_in === false;
    const nextIsOutage = i < arr.length - 1 ? (arr[i+1].is_plugged_in === 0 || arr[i+1].is_plugged_in === false) : isOutage;

    let battery_normal = null;
    let battery_outage = null;

    if (!isOutage) {
      battery_normal = d.battery_percent;
      if (nextIsOutage) {
        battery_outage = d.battery_percent;
      }
    } else {
      battery_outage = d.battery_percent;
      if (!nextIsOutage) {
        battery_normal = d.battery_percent;
      }
    }

    return {
      ...d,
      time: format(parseISO(d.timestamp + "Z"), "HH:mm"),
      battery_normal,
      battery_outage
    };
  });

  const netChartData = [...(networkHistory || [])].reverse().map(d => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm:ss"),
    ping: d.status ? 1 : 0
  }));

  const speedChartData = [...(speedtestHistory || [])].reverse().map(d => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm"),
    download: d.download_mbps,
    upload: d.upload_mbps
  }));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b">
          <div className="flex items-center gap-4">
            <Server className="h-6 w-6 text-foreground" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">HomePulse</h1>
              <p className="text-sm text-muted-foreground">Server & Network Telemetry</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isServerOnline ? "default" : "destructive"}>
              {isServerOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Battery</CardTitle>
              {isPluggedIn === null ? <BatteryWarning className="h-4 w-4 text-orange-500" /> : (isPluggedIn ? <Zap className="h-4 w-4 text-green-500" /> : <Battery className="h-4 w-4 text-destructive" />)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batteryPct !== undefined ? `${batteryPct}%` : "N/A"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isPluggedIn === null ? "Sensor unavailable" : (isPluggedIn ? "AC Connected" : "Running on battery")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Power Grid</CardTitle>
              {hasOngoingOutage ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <ActivitySquare className="h-4 w-4 text-green-500" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isPluggedIn === null ? "---" : (hasOngoingOutage ? "OUTAGE" : "STABLE")}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {isPluggedIn === null ? "Docker WSL Limitation" : (hasOngoingOutage ? "Running on UPS/Battery" : "Normal service")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Connectivity</CardTitle>
              <Globe className={`h-4 w-4 ${isNetworkOk ? "text-green-500" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isNetworkOk ? "ONLINE" : "OFFLINE"}</div>
              <p className="text-xs text-muted-foreground mt-1">IFACE: {health?.active_interface || "N/A"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Speedtest (DL / UL)</CardTitle>
              <Wifi className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {speedtestLatest?.download_mbps ? speedtestLatest.download_mbps.toFixed(1) : "---"} / {speedtestLatest?.upload_mbps ? speedtestLatest.upload_mbps.toFixed(1) : "---"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Megabits per second</p>
            </CardContent>
          </Card>
        </div>

        {/* Outage Table moved up */}
        {outages && outages.length > 0 && (
          <Card>
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Power Outage History</CardTitle>
              <div className="text-xs text-muted-foreground">
                Page {outagePage} of {totalOutagePages}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px] pl-6">Date</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right pr-6">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOutages.map((outage) => (
                      <TableRow key={outage.id}>
                        <TableCell className="font-medium pl-6">
                          {format(parseISO(outage.start_time.replace(' ', 'T') + "Z"), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(parseISO(outage.start_time.replace(' ', 'T') + "Z"), "HH:mm")} - {outage.end_time ? format(parseISO(outage.end_time.replace(' ', 'T') + "Z"), "HH:mm") : "NOW"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          {outage.duration_minutes ? (
                            <Badge variant="destructive">{Math.round(outage.duration_minutes)} MIN</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 animate-pulse">ONGOING</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalOutages > itemsPerPage && (
                <div className="flex items-center justify-end space-x-2 p-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setOutagePage(p => Math.max(1, p - 1))}
                    disabled={outagePage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setOutagePage(p => Math.min(totalOutagePages, p + 1))}
                    disabled={outagePage === totalOutagePages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Power Consumption & Battery</CardTitle>
              <CardDescription className="text-xs">Visualizing power discharge and grid outages over time.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pb-6">
              {powerHistory && powerHistory.length > 0 ? (
                <ChartContainer config={powerChartConfig} className="flex-1 min-h-[300px] h-full w-full">
                  <AreaChart data={powerChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis hide domain={[0, 100]} />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    
                    <Area type="stepAfter" dataKey="battery_normal" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} connectNulls={false} />
                    <Area type="stepAfter" dataKey="battery_outage" stroke="#f97316" fill="#f97316" fillOpacity={0.2} connectNulls={false} />
                    <Brush 
                      dataKey="time" 
                      height={40} 
                      stroke="#22c55e" 
                      fill="hsl(var(--muted))" 
                      travellerWidth={8}
                      startIndex={Math.max(0, powerChartData.length - 120)} 
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">No data.</div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4 h-full">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Ping Stability</CardTitle>
                <CardDescription className="text-xs">Continuous uptime barcode representing server connectivity.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-6">
                {networkHistory && networkHistory.length > 0 ? (
                  <ChartContainer config={networkChartConfig} className="flex-1 w-full h-full min-h-[100px]">
                    <AreaChart data={netChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={8} />
                      <YAxis hide domain={[0, 1.5]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="stepAfter" dataKey="ping" stroke="var(--color-ping)" fill="var(--color-ping)" fillOpacity={0.2} isAnimationActive={false} />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data.</div>
                )}
              </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <CardDescription className="text-xs">Periodic speed tests showing download and upload speeds.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-6">
                {speedtestHistory && speedtestHistory.length > 0 ? (
                  <ChartContainer config={speedtestChartConfig} className="flex-1 w-full h-full min-h-[100px]">
                    <BarChart data={speedChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={8} />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                      <Bar dataKey="download" fill="var(--color-download)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="upload" fill="var(--color-upload)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
