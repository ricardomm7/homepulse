"use client"
import { useState, useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { format, parseISO, subHours } from "date-fns";
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Brush, LineChart, Line, ComposedChart } from "recharts";
import { Battery, BatteryWarning, Globe, Wifi, ActivitySquare, AlertTriangle, Zap, Server, ChevronLeft, ChevronRight, HardDrive, Gauge, ZapOff, ArrowDownToLine, ArrowUpFromLine, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Chart Configs
const powerChartConfig = {
  battery_normal: { label: "Battery", color: "#22c55e" },
  battery_outage: { label: "Discharging", color: "#f97316" },
} satisfies ChartConfig;

const electricChartConfig = {
  voltage: { label: "Voltage (V)", color: "#eab308" },
  wattage: { label: "Wattage (W)", color: "#a855f7" },
} satisfies ChartConfig;

const networkChartConfig = {
  ping: { label: "Uptime", color: "#3b82f6" },
} satisfies ChartConfig;

const speedtestChartConfig = {
  download: { label: "Download", color: "#0ea5e9" },
  upload: { label: "Upload", color: "#8b5cf6" },
  ping_ms: { label: "Ping (ms)", color: "#ef4444" },
} satisfies ChartConfig;

export default function Dashboard() {
  const { health, powerLatest, powerHistory, outages, networkHistory, speedtestLatest, speedtestHistory, isLoading } = useDashboardData();
  const [outagePage, setOutagePage] = useState(1);
  const [powerHistPage, setPowerHistPage] = useState(1);
  const [networkTimeFilter, setNetworkTimeFilter] = useState("12"); // Default 12 hours
  const itemsPerPage = 10;
  const powerItemsPerPage = 20;


  // Derived states
  const isServerOnline = !!health && health.status === "ok";
  const batteryPct = powerLatest?.battery_percent !== null && powerLatest?.battery_percent !== undefined ? Math.round(powerLatest?.battery_percent) : undefined;
  const isPluggedIn = powerLatest?.is_plugged_in;
  const hasOngoingOutage = outages && outages.length > 0 && !outages[0].end_time;
  const isNetworkOk = networkHistory && networkHistory.length > 0 ? networkHistory[0].status : false;

  // Pagination Logic (Outages)
  const totalOutages = outages?.length || 0;
  const totalOutagePages = Math.max(1, Math.ceil(totalOutages / itemsPerPage));
  const paginatedOutages = outages?.slice((outagePage - 1) * itemsPerPage, outagePage * itemsPerPage) || [];

  // Pagination Logic (Power History Table)
  const totalPowerLogs = powerHistory?.length || 0;
  const totalPowerPages = Math.max(1, Math.ceil(totalPowerLogs / powerItemsPerPage));
  const paginatedPowerHistory = powerHistory?.slice((powerHistPage - 1) * powerItemsPerPage, powerHistPage * powerItemsPerPage) || [];

  // Chart Mappers
  const powerChartData = [...(powerHistory || [])].reverse().map((d: any, i: number, arr: any[]) => {
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
      fullTime: format(parseISO(d.timestamp + "Z"), "dd/MM HH:mm"),
      battery_normal,
      battery_outage,
      voltage: d.voltage,
      wattage: d.wattage
    };
  });

  // Filter Network Data by Time
  const filteredNetHistory = useMemo(() => {
    if (!networkHistory) return [];
    const cutoff = subHours(new Date(), parseInt(networkTimeFilter));
    return networkHistory.filter((d: any) => new Date(d.timestamp + "Z") >= cutoff);
  }, [networkHistory, networkTimeFilter]);

  const netChartData = [...filteredNetHistory].reverse().map((d: any) => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm:ss"),
    ping: d.status ? 1 : 0
  }));

  const filteredSpeedHistory = useMemo(() => {
    if (!speedtestHistory) return [];
    const cutoff = subHours(new Date(), parseInt(networkTimeFilter));
    return speedtestHistory.filter((d: any) => new Date(d.timestamp + "Z") >= cutoff);
  }, [speedtestHistory, networkTimeFilter]);

  const speedChartData = [...filteredSpeedHistory].reverse().map((d: any) => ({
    ...d,
    time: format(parseISO(d.timestamp + "Z"), "HH:mm"),
    download: d.download_mbps,
    upload: d.upload_mbps,
    ping_ms: d.ping_ms
  }));

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
            <span className="text-sm text-muted-foreground">System Status</span>
            <Badge variant={isServerOnline ? "default" : "destructive"} className="rounded-none">
              {isServerOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-none mb-6">
            <TabsTrigger value="overview" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="network" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Network</TabsTrigger>
            <TabsTrigger value="power" className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Power</TabsTrigger>
          </TabsList>

          {/* ==================================================== */}
          {/* OVERVIEW TAB */}
          {/* ==================================================== */}
          <TabsContent value="overview" className="space-y-6 outline-none">
            {/* Overview KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-none">
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

              <Card className="rounded-none">
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

              <Card className="rounded-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Connectivity</CardTitle>
                  <Globe className={`h-4 w-4 ${isNetworkOk ? "text-green-500" : "text-destructive"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isNetworkOk ? "ONLINE" : "OFFLINE"}</div>
                  <p className="text-xs text-muted-foreground mt-1">IFACE: {health?.active_interface || "N/A"}</p>
                </CardContent>
              </Card>

              <Card className="rounded-none">
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

            {/* Outage Table */}
            {outages && outages.length > 0 && (
              <Card className="rounded-none">
                <CardHeader className="border-b flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-medium">Power Outage History</CardTitle>
                  <div className="text-xs text-muted-foreground">
                    Page {outagePage} of {totalOutagePages}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col">
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[150px] pl-6">Date</TableHead>
                          <TableHead>Period</TableHead>
                          <TableHead className="text-right pr-6">Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOutages.map((outage: any) => (
                          <TableRow key={outage.id}>
                            <TableCell className="font-medium pl-6">
                              {format(parseISO(outage.start_time.replace(' ', 'T') + "Z"), "dd/MM/yyyy")}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(parseISO(outage.start_time.replace(' ', 'T') + "Z"), "HH:mm")} - {outage.end_time ? format(parseISO(outage.end_time.replace(' ', 'T') + "Z"), "HH:mm") : "NOW"}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              {outage.duration_minutes ? (
                                <Badge variant="destructive" className="rounded-none">{Math.round(outage.duration_minutes)} MIN</Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 animate-pulse rounded-none">ONGOING</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                  
                  {totalOutages > itemsPerPage && (
                    <div className="flex items-center justify-end space-x-2 p-4 border-t">
                      <Button variant="outline" size="sm" className="rounded-none" onClick={() => setOutagePage(p => Math.max(1, p - 1))} disabled={outagePage === 1}>
                        <ChevronLeft className="h-4 w-4" /> Previous
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-none" onClick={() => setOutagePage(p => Math.min(totalOutagePages, p + 1))} disabled={outagePage === totalOutagePages}>
                        Next <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ==================================================== */}
          {/* NETWORK TAB */}
          {/* ==================================================== */}
          <TabsContent value="network" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ArrowDownToLine className="h-4 w-4 text-blue-500" /> Download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{speedtestLatest?.download_mbps ? speedtestLatest.download_mbps.toFixed(1) : "---"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Mbps</p>
                </CardContent>
              </Card>

              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4 text-purple-500" /> Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{speedtestLatest?.upload_mbps ? speedtestLatest.upload_mbps.toFixed(1) : "---"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Mbps</p>
                </CardContent>
              </Card>

              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-500" /> Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{speedtestLatest?.ping_ms ? speedtestLatest.ping_ms.toFixed(1) : "---"}</div>
                  <p className="text-xs text-muted-foreground mt-1">Ping (ms)</p>
                </CardContent>
              </Card>

              <Card className="rounded-none md:col-span-3">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Network Interface</CardTitle>
                    <CardDescription className="text-xs">Physical adapter details and limits.</CardDescription>
                  </div>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex justify-between items-center bg-muted/50 p-4 border mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Interface Name</p>
                    <p className="text-lg font-bold font-mono">{speedtestLatest?.interface_name || "UNKNOWN"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Max Link Speed</p>
                    <p className="text-lg font-bold font-mono">{speedtestLatest?.interface_max_speed_mbps ? `${speedtestLatest.interface_max_speed_mbps} Mbps` : "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="flex flex-col h-full rounded-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Ping Stability</CardTitle>
                    <CardDescription className="text-xs">Continuous uptime barcode representing server connectivity.</CardDescription>
                  </div>
                  <Select value={networkTimeFilter} onValueChange={setNetworkTimeFilter}>
                    <SelectTrigger className="w-[120px] rounded-none">
                      <SelectValue placeholder="Time Filter" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="1">Last 1h</SelectItem>
                      <SelectItem value="12">Last 12h</SelectItem>
                      <SelectItem value="24">Last 24h</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pb-6 min-h-[300px]">
                  {filteredNetHistory && filteredNetHistory.length > 0 ? (
                    <ChartContainer config={networkChartConfig} className="flex-1 w-full h-full">
                      <AreaChart data={netChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={8} />
                        <YAxis hide domain={[0, 1.5]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="stepAfter" dataKey="ping" stroke="var(--color-ping)" fill="var(--color-ping)" fillOpacity={0.2} isAnimationActive={false} />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data for selected period.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col h-full rounded-none">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium">Throughput & Latency History</CardTitle>
                    <CardDescription className="text-xs">Periodic speed tests showing bandwidth and ping.</CardDescription>
                  </div>
                  <Select value={networkTimeFilter} onValueChange={setNetworkTimeFilter}>
                    <SelectTrigger className="w-[120px] rounded-none">
                      <SelectValue placeholder="Time Filter" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="1">Last 1h</SelectItem>
                      <SelectItem value="12">Last 12h</SelectItem>
                      <SelectItem value="24">Last 24h</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pb-6 min-h-[300px]">
                  {filteredSpeedHistory && filteredSpeedHistory.length > 0 ? (
                    <ChartContainer config={speedtestChartConfig} className="flex-1 w-full h-full">
                      <ComposedChart data={speedChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} tickMargin={8} />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                        <Bar dataKey="download" fill="var(--color-download)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="upload" fill="var(--color-upload)" radius={[0, 0, 0, 0]} />
                        <Line type="monotone" dataKey="ping_ms" stroke="var(--color-ping_ms)" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No data.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ==================================================== */}
          {/* POWER TAB */}
          {/* ==================================================== */}
          <TabsContent value="power" className="space-y-6 outline-none">
            
            {/* Gauges/KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Battery className="h-4 w-4 text-green-500" /> Battery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{batteryPct !== undefined ? `${batteryPct}%` : "---"}</div>
                </CardContent>
              </Card>
              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" /> Voltage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{powerLatest?.voltage ? `${powerLatest.voltage.toFixed(1)}V` : "---"}</div>
                </CardContent>
              </Card>
              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-purple-500" /> Wattage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{powerLatest?.wattage ? `${powerLatest.wattage.toFixed(1)}W` : "---"}</div>
                </CardContent>
              </Card>
              <Card className="rounded-none bg-slate-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <ZapOff className="h-4 w-4 text-destructive" /> Grid Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold pt-1">{isPluggedIn === null ? "UNKNOWN" : (hasOngoingOutage ? "OUTAGE (BATTERY)" : "ONLINE (AC)")}</div>
                </CardContent>
              </Card>
            </div>

            {/* Power History Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="flex flex-col h-full rounded-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Battery Discharge Cycle</CardTitle>
                  <CardDescription className="text-xs">Visualizing power discharge and grid outages over time.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pb-6 min-h-[300px]">
                  {powerHistory && powerHistory.length > 0 ? (
                    <ChartContainer config={powerChartConfig} className="flex-1 h-full w-full">
                      <AreaChart data={powerChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis hide domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                        <Area type="stepAfter" dataKey="battery_normal" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} connectNulls={false} />
                        <Area type="stepAfter" dataKey="battery_outage" stroke="#f97316" fill="#f97316" fillOpacity={0.2} connectNulls={false} />
                        <Brush dataKey="time" height={40} stroke="#22c55e" fill="hsl(var(--muted))" travellerWidth={8} startIndex={Math.max(0, powerChartData.length - 120)} />
                      </AreaChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col h-full rounded-none">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Electrical Telemetry</CardTitle>
                  <CardDescription className="text-xs">Historical Voltage (V) and Wattage (W) metrics.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col pb-6 min-h-[300px]">
                  {powerHistory && powerHistory.length > 0 ? (
                    <ChartContainer config={electricChartConfig} className="flex-1 h-full w-full">
                      <LineChart data={powerChartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                        <YAxis hide />
                        <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} />
                        <Line type="monotone" dataKey="voltage" stroke="var(--color-voltage)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="wattage" stroke="var(--color-wattage)" strokeWidth={2} dot={false} />
                        <Brush dataKey="time" height={40} stroke="#eab308" fill="hsl(var(--muted))" travellerWidth={8} startIndex={Math.max(0, powerChartData.length - 120)} />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data.</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Exhaustive Power Logs Table */}
            <Card className="rounded-none">
              <CardHeader className="border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Exhaustive Power Logs</CardTitle>
                  <CardDescription className="text-xs">Raw database entries for power telemetry.</CardDescription>
                </div>
                <div className="text-xs text-muted-foreground">
                  Page {powerHistPage} of {totalPowerPages}
                </div>
              </CardHeader>
              <CardContent className="p-0 flex flex-col">
                <ScrollArea className="h-[400px] w-full">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[180px] pl-6">Timestamp</TableHead>
                        <TableHead>Grid Status</TableHead>
                        <TableHead className="text-right">Battery</TableHead>
                        <TableHead className="text-right">Voltage</TableHead>
                        <TableHead className="text-right pr-6">Wattage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPowerHistory.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium pl-6 text-muted-foreground">
                            {format(parseISO(log.timestamp + "Z"), "dd/MM/yyyy HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {log.is_plugged_in === 0 || log.is_plugged_in === false ? (
                              <Badge variant="destructive" className="rounded-none">OUTAGE</Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-500 rounded-none border-green-500/20 bg-green-500/10">AC POWER</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">{log.battery_percent ? `${Math.round(log.battery_percent)}%` : "---"}</TableCell>
                          <TableCell className="text-right font-mono">{log.voltage ? `${log.voltage.toFixed(1)}V` : "---"}</TableCell>
                          <TableCell className="text-right pr-6 font-mono">{log.wattage ? `${log.wattage.toFixed(1)}W` : "---"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
                
                {/* Pagination Controls */}
                {totalPowerLogs > powerItemsPerPage && (
                  <div className="flex items-center justify-end space-x-2 p-4 border-t">
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => setPowerHistPage(p => Math.max(1, p - 1))} disabled={powerHistPage === 1}>
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-none" onClick={() => setPowerHistPage(p => Math.min(totalPowerPages, p + 1))} disabled={powerHistPage === totalPowerPages}>
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
