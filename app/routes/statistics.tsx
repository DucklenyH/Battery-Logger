import { BatteryCharging, BarChart3, Gauge } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCompletedMatches, readLocalData, type LocalMatch, type LocalReading } from "../lib/local-data";

export function meta() {
  return [{ title: "Statistics · Battery Logger" }];
}

export default function Statistics() {
  const [data] = useState(() => readLocalData());
  const readings = data.readings;
  const [selectedBatteryId, setSelectedBatteryId] = useState(() => readings[0]?.batteryId ?? "");
  const [deepDiveView, setDeepDiveView] = useState<"ir" | "voltage" | "charge">("ir");
  const [comparisonView, setComparisonView] = useState<"ir" | "voltage" | "usage">("ir");
  const [comparisonKind, setComparisonKind] = useState<"all" | "Competition" | "Demo">("all");
  const latestByBattery = Array.from(new Map(readings.map((reading) => [reading.batteryId, reading])).values()).sort((a, b) => a.batteryName.localeCompare(b.batteryName, undefined, { numeric: true, sensitivity: "base" }));
  const visibleLatestByBattery = latestByBattery.filter((reading) => comparisonKind === "all" || data.batteries.find((battery) => battery.id === reading.batteryId)?.kind === comparisonKind);
  const selectedBatteryIdForView = visibleLatestByBattery.some((reading) => reading.batteryId === selectedBatteryId) ? selectedBatteryId : visibleLatestByBattery[0]?.batteryId ?? "";
  const selectedBatteryName = data.batteries.find((battery) => battery.id === selectedBatteryIdForView)?.name ?? visibleLatestByBattery.find((reading) => reading.batteryId === selectedBatteryIdForView)?.batteryName;
  const average = (values: Array<number | null>) => {
    const numbers = values.filter((value): value is number => value !== null && Number.isFinite(value));
    return numbers.length ? numbers.reduce((total, value) => total + value, 0) / numbers.length : null;
  };
  const scopedMatches = data.batteries
    .filter((battery) => comparisonKind === "all" || battery.kind === comparisonKind)
    .flatMap((battery) => getCompletedMatches(readings.filter((reading) => reading.batteryId === battery.id)));
  const averageVoltageDrop = average(scopedMatches.map((match) => {
    const preVoltage = [match.pre.v0, match.pre.v1, match.pre.v2].every((value) => value !== null) ? (match.pre.v0 ?? 0) + (match.pre.v1 ?? 0) + (match.pre.v2 ?? 0) : null;
    const postVoltage = [match.post.v0, match.post.v1, match.post.v2].every((value) => value !== null) ? (match.post.v0 ?? 0) + (match.post.v1 ?? 0) + (match.post.v2 ?? 0) : null;
    return preVoltage !== null && postVoltage !== null ? preVoltage - postVoltage : null;
  }));
  const averageChargeUsed = average(scopedMatches.map((match) => match.pre.charge !== null && match.post.charge !== null ? match.pre.charge - match.post.charge : null));
  const averagePostMatchIr = average(scopedMatches.map((match) => match.post.ir));
  const selectedReadings = readings.filter((reading) => reading.batteryId === selectedBatteryIdForView);
  const deepDiveMatches = getCompletedMatches(selectedReadings).slice(-5);
  const selectedLatest = deepDiveMatches[deepDiveMatches.length - 1]?.post;
  const selectedAverageIr = average(deepDiveMatches.map((match) => match.post.ir));
  const selectedAverageVoltage = average(deepDiveMatches.map((match) => [match.post.v0, match.post.v1, match.post.v2].every((value) => value !== null) ? (match.post.v0 ?? 0) + (match.post.v1 ?? 0) + (match.post.v2 ?? 0) : null));
  const selectedAverageCharge = average(deepDiveMatches.map((match) => match.post.charge));
  const rankings = Array.from(new Map(readings.map((reading) => [reading.batteryId, readings.filter((item) => item.batteryId === reading.batteryId)])).entries()).map(([batteryId, batteryReadings]) => {
    const matches = getCompletedMatches(batteryReadings);
    if (!matches.length) return null;
    const latest = matches[matches.length - 1].post;
    const avgIr = average(matches.map((match) => match.post.ir));
    const avgVoltage = average(matches.map((match) => [match.post.v0, match.post.v1, match.post.v2].every((value) => value !== null) ? (match.post.v0 ?? 0) + (match.post.v1 ?? 0) + (match.post.v2 ?? 0) : null));
    const avgCharge = average(matches.map((match) => match.post.charge));
    return { batteryId, name: latest.batteryName, kind: data.batteries.find((battery) => battery.id === batteryId)?.kind ?? "Competition", matches: matches.length, avgIr, avgVoltage, avgCharge, status: latest.status };
  }).filter((item): item is NonNullable<typeof item> => item !== null).sort((a, b) => (a.avgIr ?? Number.POSITIVE_INFINITY) - (b.avgIr ?? Number.POSITIVE_INFINITY));
  const comparisonItems = rankings.filter((item) => comparisonKind === "all" || item.kind === comparisonKind).sort((a, b) => {
    const aValue = comparisonView === "ir" ? a.avgIr : comparisonView === "voltage" ? a.avgVoltage : a.matches;
    const bValue = comparisonView === "ir" ? b.avgIr : comparisonView === "voltage" ? b.avgVoltage : b.matches;
    return comparisonView === "ir" ? (aValue ?? Number.POSITIVE_INFINITY) - (bValue ?? Number.POSITIVE_INFINITY) : (bValue ?? Number.NEGATIVE_INFINITY) - (aValue ?? Number.NEGATIVE_INFINITY);
  });
  const formatNumber = (value: number | null, suffix = "") => value === null ? "—" : `${value.toFixed(1)}${suffix}`;
  return (
    <main className="stats-page mx-auto max-w-5xl pb-8 pt-3">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Statistics</h1>
          <p className="mt-2 text-sm text-[#315979] dark:text-[#b8d2df]">A quick read on the team battery fleet.</p>
        </div>
        <Select value={comparisonKind} onValueChange={(value) => setComparisonKind((value ?? "all") as "all" | "Competition" | "Demo")}><SelectTrigger className="w-40 border-[#9ecde7] bg-white text-[#002a44] dark:border-[#1c5375] dark:bg-[#102f47] dark:text-white"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All battery types</SelectItem><SelectItem value="Competition">Competition batteries</SelectItem><SelectItem value="Demo">Demo batteries</SelectItem></SelectContent></Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total matches played" value={String(scopedMatches.length)} detail={scopedMatches.length ? "Completed battery matches" : "No completed matches yet"} icon={BatteryCharging} />
        <StatCard label="Average voltage drop" value={formatNumber(averageVoltageDrop, " V")} detail={scopedMatches.length ? "Pre-match to post-match" : "No completed matches yet"} icon={Gauge} />
        <StatCard label="Average charge used in a match" value={formatNumber(averageChargeUsed, "%")} detail={scopedMatches.length ? "Pre-match to post-match" : "No completed matches yet"} icon={BarChart3} />
        <StatCard label="Average IR post match" value={formatNumber(averagePostMatchIr, " mΩ")} detail={scopedMatches.length ? "Completed battery matches" : "No completed matches yet"} icon={Gauge} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="stats-card">
          <CardHeader><CardTitle>Battery comparison</CardTitle></CardHeader>
          <CardContent>
            {comparisonItems.length === 0 ? <EmptyChart label={readings.length ? "No saved readings for this battery type." : "Battery comparison will appear after the first reading."} /> : <><div className="mb-4 grid w-full grid-cols-3 rounded-xl border border-[#b6d8ed] bg-[#eaf4fb] p-1 dark:border-[#29415f] dark:bg-[#101d31]"><Button variant={comparisonView === "ir" ? "default" : "ghost"} size="sm" onClick={() => setComparisonView("ir")}>Internal resistance</Button><Button variant={comparisonView === "voltage" ? "default" : "ghost"} size="sm" onClick={() => setComparisonView("voltage")}>Post-match voltage</Button><Button variant={comparisonView === "usage" ? "default" : "ghost"} size="sm" onClick={() => setComparisonView("usage")}>Match usage</Button></div><FleetComparisonChart items={comparisonItems} view={comparisonView} /></>}
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardHeader>
            <CardTitle>Battery deep dive</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedBatteryIdForView} onValueChange={(value) => setSelectedBatteryId(value ?? "")}>
              <SelectTrigger className="w-full border-[#9ecde7] bg-white text-[#002a44] dark:border-[#29415f] dark:bg-[#101d31] dark:text-white"><SelectValue placeholder="Select a battery">{selectedBatteryName}</SelectValue></SelectTrigger>
              <SelectContent>{visibleLatestByBattery.length === 0 ? <SelectItem value="unconfigured" disabled>No batteries in this type</SelectItem> : visibleLatestByBattery.map((reading) => <SelectItem key={reading.batteryId} value={reading.batteryId}>{reading.batteryName}</SelectItem>)}</SelectContent>
            </Select>
            {selectedLatest ? <><div className="grid grid-cols-3 gap-2"><MiniMetric label="Avg IR" value={formatNumber(selectedAverageIr, " mΩ")} /><MiniMetric label="Avg voltage" value={formatNumber(selectedAverageVoltage, " V")} /><MiniMetric label="Avg charge" value={formatNumber(selectedAverageCharge, "%")} /></div><div className="grid grid-cols-3 rounded-xl border border-[#b6d8ed] bg-[#eaf4fb] p-1 dark:border-[#29415f] dark:bg-[#101d31]"><Button variant={deepDiveView === "ir" ? "default" : "ghost"} size="sm" onClick={() => setDeepDiveView("ir")}>IR health</Button><Button variant={deepDiveView === "voltage" ? "default" : "ghost"} size="sm" onClick={() => setDeepDiveView("voltage")}>Voltage</Button><Button variant={deepDiveView === "charge" ? "default" : "ghost"} size="sm" onClick={() => setDeepDiveView("charge")}>Charge</Button></div><DeepDiveChart matches={deepDiveMatches} view={deepDiveView} /></> : <EmptyChart label={readings.length ? "Select a battery with a completed match." : "Save a matched pair of readings to inspect its history."} compact />}
          </CardContent>
        </Card>
      </div>

      <Card className="stats-card mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Health ranking</CardTitle>
          <span className="text-xs text-[#315979] dark:text-[#b8d2df]">{readings.length ? "Sorted by avg IR" : "No data"}</span>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? <p className="rounded-xl border border-dashed border-[#9ecde7] p-6 text-center text-sm text-[#315979] dark:border-[#29415f] dark:text-[#b8d2df]">Add readings from the Logger page to rank battery health.</p> : <div className="divide-y divide-[#b6d8ed] dark:divide-[#29415f]">{rankings.map((item, index) => { const healthWidth = item.avgIr === null ? 35 : Math.max(8, Math.min(100, 100 - (item.avgIr / 20) * 100)); return <div key={item.batteryId} className="py-4 first:pt-0 last:pb-0"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="w-5 text-sm font-bold text-[#315979] dark:text-[#b8d2df]">{index + 1}.</span><p className="truncate text-lg font-black text-[#002a44] dark:text-white">{item.name}</p><span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "Good" ? "border-green-500/60 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" : "border-[#b6d8ed] bg-[#eaf4fb] text-[#315979] dark:border-[#29415f] dark:bg-[#101d31] dark:text-[#b8d2df]"}`}>{item.status}</span></div><span className="shrink-0 font-black text-[#00517e] dark:text-[#65c6f7]">{formatNumber(item.avgIr, "mΩ")}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#d8ecf8] dark:bg-[#18284a]"><div className="h-full rounded-full bg-[#0086cb]" style={{ width: `${healthWidth}%` }} /></div><p className="mt-2 text-xs text-[#315979] dark:text-[#b8d2df]">{item.matches} match{item.matches === 1 ? "" : "es"} · avg voltage {formatNumber(item.avgVoltage, " V")} · avg charge {formatNumber(item.avgCharge, "%")}</p></div>; })}</div>}
        </CardContent>
      </Card>
    </main>
  );
}

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof BatteryCharging }) {
  return (
    <Card className="stats-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-[#315979] dark:text-[#b8d2df]">{label}</p>
          <Icon className="size-4 text-[#fbdc0a]" aria-hidden />
        </div>
        <p className="mt-3 text-3xl font-black text-[#00517e] dark:text-white">{value}</p>
        <p className="mt-1 text-xs text-[#315979] dark:text-[#b8d2df]">{detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={`grid place-items-center rounded-xl border border-dashed border-[#9ecde7] bg-[#dff0fa] px-6 text-center text-sm text-[#315979] dark:border-[#29415f] dark:bg-[#101d31] dark:text-[#b8d2df] ${compact ? "h-40" : "h-56"}`}>
      <div className="space-y-2">
        <BarChart3 className="mx-auto size-6 text-[#00517e] dark:text-[#b8d2df]" aria-hidden />
        <p>{label}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#b6d8ed] bg-[#eaf4fb] p-3 dark:border-[#29415f] dark:bg-[#101d31]"><p className="text-xs text-[#315979] dark:text-[#b8d2df]">{label}</p><p className="mt-1 truncate text-sm font-black text-[#00517e] dark:text-[#fbdc0a]">{value}</p></div>;
}

function FleetComparisonChart({ items, view }: { items: Array<{ batteryId: string; name: string; avgIr: number | null; avgVoltage: number | null; avgCharge: number | null; matches: number }>; view: "ir" | "voltage" | "usage" }) {
  const values = items.map((item) => view === "ir" ? item.avgIr : view === "voltage" ? item.avgVoltage : item.matches);
  const formatValue = (value: number | null) => value === null ? "—" : view === "usage" ? `M${value.toFixed(0)}` : `${value.toFixed(view === "voltage" ? 1 : 0)}${view === "ir" ? "mΩ" : " V"}`;
  const max = Math.max(1, ...values.map((value) => value ?? 0));
  const width = 620; const rowHeight = 48; const left = 50; const right = 76; const top = 12; const bottom = 28; const height = top + bottom + items.length * rowHeight;
  const unit = view === "ir" ? "mΩ" : view === "voltage" ? "V" : "M";
  const axisDecimals = view === "voltage" || (view === "ir" && max < 10) ? 1 : 0;
  const axisSteps = view === "usage" && max <= 12 ? Array.from({ length: Math.ceil(max) + 1 }, (_, index) => index / Math.max(1, Math.ceil(max))) : [0, 0.25, 0.5, 0.75, 1];
  const title = view === "ir" ? "Internal resistance" : view === "voltage" ? "Post-match voltage" : "Match usage";
  return <div className="rounded-xl border border-[#b6d8ed] bg-[#f4f9fc] p-3 dark:border-[#29415f] dark:bg-[#101d31]"><div className="mb-2 flex items-center justify-between text-xs text-[#315979] dark:text-[#b8d2df]"><span>{title}</span><span>Compared across batteries</span></div><svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${title} battery comparison chart`}>{axisSteps.map((fraction) => { const gridX = left + fraction * (width - left - right); const axisValue = max * fraction; return <g key={fraction}><line x1={gridX} y1={top} x2={gridX} y2={height - bottom} stroke="currentColor" strokeDasharray="4 5" className="text-[#c8e1ef] dark:text-[#29415f]" /><text x={gridX} y={height - 8} textAnchor="middle" className="fill-[#315979] text-[11px] dark:fill-[#b8d2df]">{view === "usage" ? `M${axisValue.toFixed(0)}` : `${axisValue.toFixed(axisDecimals)}${unit}`}</text></g>; })}{items.map((item, index) => { const value = values[index]; const y = top + index * rowHeight + 8; const barWidth = value === null ? 0 : Math.max(5, (value / max) * (width - left - right)); return <g key={item.batteryId}><text x="8" y={y + 16} textAnchor="start" className="fill-[#002a44] text-[13px] font-bold dark:fill-white">{item.name}</text><rect x={left} y={y} width={barWidth} height="22" rx="5" fill="currentColor" className="text-[#0086cb]" /><text x={Math.min(left + barWidth + 8, width - right)} y={y + 16} className="fill-[#315979] text-[12px] font-bold dark:fill-[#b8d2df]">{formatValue(value)}</text></g>; })}</svg><p className="mt-1 text-xs text-[#315979] dark:text-[#b8d2df]">{view === "ir" ? "Lower resistance is healthier; compare the bar lengths and axis values." : "Bars are scaled against the highest saved value."}</p></div>;
}

function DeepDiveChart({ matches, view }: { matches: LocalMatch[]; view: "ir" | "voltage" | "charge" }) {
  const recent = matches.slice(-5);
  const metric = view === "charge" ? "Charge (%)" : view === "voltage" ? "Total voltage (V)" : "Internal resistance (mΩ)";
  const valueFor = (reading: LocalReading) => view === "charge" ? reading.charge : view === "voltage" ? [reading.v0, reading.v1, reading.v2].every((value) => value !== null) ? (reading.v0 ?? 0) + (reading.v1 ?? 0) + (reading.v2 ?? 0) : null : reading.ir;
  const prePoints = recent.map((match, index) => ({ index, value: valueFor(match.pre) })).filter((point): point is { index: number; value: number } => point.value !== null && Number.isFinite(point.value));
  const postPoints = recent.map((match, index) => ({ index, value: valueFor(match.post) })).filter((point): point is { index: number; value: number } => point.value !== null && Number.isFinite(point.value));
  const points = view === "ir" ? [...prePoints, ...postPoints] : recent.map((match, index) => ({ index, value: valueFor(match.post) })).filter((point): point is { index: number; value: number } => point.value !== null && Number.isFinite(point.value));
  if (!points.length) return <EmptyChart label="More saved values are needed to draw this history." compact />;
  const maxValue = view === "charge" ? 130 : view === "ir" ? Math.max(20, ...points.map((point) => point.value)) : Math.max(15, ...points.map((point) => point.value));
  const width = 640; const height = 280; const left = 54; const right = 18; const top = 22; const bottom = 48;
  const x = (index: number) => recent.length === 1 ? (width - left - right) / 2 + left : left + (index / (recent.length - 1)) * (width - left - right);
  const y = (value: number) => top + (1 - value / maxValue) * (height - top - bottom);
  const pointsString = (items: Array<{ index: number; value: number }>) => items.map((point) => `${x(point.index)},${y(point.value)}`).join(" ");
  const valueLabel = (value: number) => `${value.toFixed(view === "charge" ? 0 : 1)}${view === "charge" ? "%" : view === "voltage" ? "V" : "mΩ"}`;
  const axisUnit = view === "charge" ? "%" : view === "voltage" ? "V" : "mΩ";
  const chartTitle = view === "ir" ? "IR health by match" : view === "voltage" ? "Voltage by match" : "Charge by match";
  return <div className="rounded-xl border border-[#b6d8ed] bg-[#f4f9fc] p-3 dark:border-[#29415f] dark:bg-[#0b1727]"><div className="mb-2 flex items-center justify-between text-xs text-[#315979] dark:text-[#b8d2df]"><span className="font-bold">{chartTitle}</span><span>Last {recent.length} match{recent.length === 1 ? "" : "es"}</span></div><svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={`${chartTitle} history chart`}><text x="12" y={height / 2} transform={`rotate(-90 12 ${height / 2})`} textAnchor="middle" className="fill-[#315979] text-[11px] dark:fill-[#b8d2df]">{metric}</text><line x1={left} y1={top} x2={left} y2={height - bottom} stroke="currentColor" className="text-[#9ecde7]" /><line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="currentColor" className="text-[#9ecde7]" />{[0, 0.25, 0.5, 0.75, 1].map((fraction) => { const lineY = top + fraction * (height - top - bottom); return <g key={fraction}><line x1={left} y1={lineY} x2={width - right} y2={lineY} stroke="currentColor" strokeDasharray="4 5" className="text-[#c8e1ef] dark:text-[#29415f]" /><text x={left - 8} y={lineY + 4} textAnchor="end" className="fill-[#315979] text-[10px] dark:fill-[#b8d2df]">{(maxValue * (1 - fraction)).toFixed(view === "voltage" ? 1 : 0)}{axisUnit}</text></g>; })}{recent.map((_, index) => <text key={index} x={x(index)} y={height - 24} textAnchor="middle" className="fill-[#315979] text-[11px] dark:fill-[#b8d2df]">M{index + 1}</text>)}<text x={(left + width - right) / 2} y={height - 5} textAnchor="middle" className="fill-[#315979] text-[11px] dark:fill-[#b8d2df]">Match number</text>{view === "ir" ? <><polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pointsString(prePoints)} className="text-[#0086cb]" /><polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pointsString(postPoints)} className="text-[#f0b429]" />{[...prePoints, ...postPoints].map((point) => <g key={`${point.index}-${point.value}`}><circle cx={x(point.index)} cy={y(point.value)} r="4" fill="currentColor" className="text-[#00517e]" /><text x={x(point.index)} y={y(point.value) - 8} textAnchor="middle" className="fill-[#315979] text-[10px] dark:fill-[#b8d2df]">{valueLabel(point.value)}</text></g>)}</> : <><polyline fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={pointsString(points)} className="text-[#0086cb]" />{points.map((point) => <g key={point.index}><circle cx={x(point.index)} cy={y(point.value)} r="4" fill="currentColor" className="text-[#fbdc0a]" /><text x={x(point.index)} y={y(point.value) - 8} textAnchor="middle" className="fill-[#315979] text-[10px] dark:fill-[#b8d2df]">{valueLabel(point.value)}</text></g>)}</>} </svg><div className="mt-2 flex flex-wrap gap-4 text-xs text-[#315979] dark:text-[#b8d2df]">{view === "ir" ? <><span><i className="mr-1 inline-block size-2 rounded-full bg-[#0086cb]" />Pre IR (off charger)</span><span><i className="mr-1 inline-block size-2 rounded-full bg-[#f0b429]" />Post IR (back on charger)</span></> : <span>Each point: {valueLabel(points[points.length - 1].value)}</span>}</div></div>;
}
