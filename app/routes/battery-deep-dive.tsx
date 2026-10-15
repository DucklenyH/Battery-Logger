import { ArrowLeft, BatteryCharging, Gauge, HeartPulse, LineChart } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function meta() {
  return [{ title: "Battery Deep Dive · Battery Logger" }];
}

export default function BatteryDeepDive() {
  return (
    <main className="stats-page mx-auto max-w-4xl py-8">
      <Button render={<Link to="/statistics" />} variant="ghost" className="mb-5 -ml-3 text-[#00517e] hover:bg-[#dff0fa] hover:text-[#002a44] dark:text-white dark:hover:bg-white/10 dark:hover:text-white">
        <ArrowLeft /> Statistics
      </Button>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0086cb]">Battery deep dive</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Battery history</h1>
        </div>
        <BatteryCharging className="size-9 text-[#00517e] dark:text-[#0086cb]" aria-hidden />
      </div>

      <Select>
        <SelectTrigger className="mb-4 h-11 w-full border-[#9ecde7] bg-white text-[#002a44] hover:bg-[#eaf4fb] dark:border-[#29415f] dark:bg-[#101d31] dark:text-white dark:hover:bg-[#162942]">
          <SelectValue placeholder="Select a battery" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unconfigured" disabled>No batteries configured yet</SelectItem>
        </SelectContent>
      </Select>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Internal resistance" value="—" icon={Gauge} />
        <Metric label="Post voltage" value="—" icon={LineChart} />
        <Metric label="Health" value="—" icon={HeartPulse} />
      </div>

      <Card className="stats-card mt-4">
        <CardHeader><CardTitle>Reading history</CardTitle></CardHeader>
        <CardContent>
          <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-[#9ecde7] bg-[#dff0fa] p-6 text-center text-sm text-[#315979] dark:border-[#29415f] dark:bg-[#0b1727] dark:text-[#b8d2df]">
            Select a battery after readings have been saved to see its voltage, charge, and internal resistance history.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Gauge }) {
  return (
    <Card className="stats-card">
      <CardContent className="p-4">
        <Icon className="size-4 text-[#00517e] dark:text-[#fbdc0a]" aria-hidden />
        <p className="mt-3 text-xs text-[#315979] dark:text-[#b8d2df]">{label}</p>
        <p className="mt-1 text-2xl font-black text-[#00517e] dark:text-[#fbdc0a]">{value}</p>
      </CardContent>
    </Card>
  );
}
