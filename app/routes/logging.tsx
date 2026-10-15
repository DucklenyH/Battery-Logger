import { Check, Circle, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { makeLocalId } from "../lib/local-data";
import { useAppData } from "../lib/app-data";

const statuses = ["Good", "Fair", "Bad", "Charge Battery"] as const;

export function meta() {
  return [{ title: "Logging · Battery Logger" }];
}

export default function Logging() {
  const backend = useAppData();
  const data = backend.data;
  const loggingData = (() => {
    if (!data) return { batteries: [], activeEvent: undefined };
    const today = new Date().toISOString().slice(0, 10);
    const activeEvent = data.events.find((event) => event.status === "Active" && event.startDate <= today && event.endDate >= today);
    const batteries = data.batteries.filter((battery) => battery.status === "Active" && (!activeEvent || (activeEvent.type === "Competition" ? battery.kind === "Competition" : battery.kind === "Demo")));
    return { batteries, activeEvent };
  })();
  const batteries = loggingData.batteries;
  const activeEvent = loggingData.activeEvent;
  const [battery, setBattery] = useState("");
  const [when, setWhen] = useState<"off" | "on">("off");
  const [status, setStatus] = useState<(typeof statuses)[number] | "">("");
  const [charge, setCharge] = useState("");
  const [values, setValues] = useState({ v0: "", v1: "", v2: "", ir: "", notes: "" });

  function updateValue(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedBattery = batteries.find((item) => item.id === battery);
    if (!selectedBattery || !status) {
      toast.error("Choose a battery and status first");
      return;
    }
    if (!data) return;
    const numberOrNull = (value: string) => value.trim() ? Number(value) : null;
    const eventReadings = data.readings.filter((reading) => reading.batteryId === selectedBattery.id && reading.eventId === activeEvent?.id);
    const nextMatchNumber = eventReadings.filter((reading) => reading.when === "on").length + 1;
    void backend.replaceData({ ...data, readings: [...data.readings, { id: makeLocalId("reading"), batteryId: selectedBattery.id, batteryName: selectedBattery.name, when, status, charge: numberOrNull(charge), v0: numberOrNull(values.v0), v1: numberOrNull(values.v1), v2: numberOrNull(values.v2), ir: numberOrNull(values.ir), notes: values.notes.trim(), recordedAt: new Date().toISOString(), eventId: activeEvent?.id, eventName: activeEvent?.name, matchNumber: nextMatchNumber }] }).then(() => toast.success("Reading saved")).catch((error: unknown) => toast.error(error instanceof Error ? error.message : "Could not save reading"));
    setStatus(""); setCharge(""); setValues({ v0: "", v1: "", v2: "", ir: "", notes: "" });
  }

  return (
    <main className="mx-auto max-w-2xl py-8">
      <div className="mb-7 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-[#002a44] dark:text-white sm:text-4xl">Log a reading</h1>
        <p className="text-[#315979] dark:text-[#b8d2df]">Copy each value from the Battery Beak, top to bottom.</p>
      </div>

      <form className="space-y-8 rounded-2xl border border-[#b6d8ed] bg-white p-5 shadow-[0_10px_24px_rgb(0_55_92/0.08)] dark:border-[#1c5375] dark:bg-[#0d2a40] dark:shadow-[0_10px_24px_rgb(0_0_0/0.18)] sm:p-6" onSubmit={submit}>
        <section className="space-y-3">
          <Label htmlFor="battery" className="text-base font-bold text-[#002a44] dark:text-white">Battery</Label>
          <Select value={battery} onValueChange={(value) => {
            const selectedBattery = value ?? "";
            const previousReadings = (data?.readings ?? []).filter((reading) => reading.batteryId === selectedBattery);
            const previousReading = previousReadings[previousReadings.length - 1];
            setBattery(selectedBattery);
            setWhen(previousReading?.when === "off" ? "on" : "off");
          }}>
            <SelectTrigger id="battery" className="h-14 w-full border-[#0086cb] bg-white text-base text-[#002a44] shadow-sm dark:bg-[#102f47] dark:text-white">
              <SelectValue placeholder="Pick a battery...">{batteries.find((item) => item.id === battery)?.name}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {batteries.length === 0 ? <SelectItem value="unconfigured" disabled>No active batteries configured yet</SelectItem> : batteries.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} · {item.kind}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeEvent ? <p className="text-sm text-[#315979] dark:text-[#b8d2df]">Showing {activeEvent.type.toLowerCase()} batteries for {activeEvent.name}.</p> : <p className="text-sm text-[#315979] dark:text-[#b8d2df]">No active event today; showing all active batteries.</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#002a44] dark:text-white">When is this reading?</h2>
          <div className="grid gap-3">
            <ChoiceCard selected={when === "off"} onClick={() => setWhen("off")} title="Coming off the charger" description="Just charged, about to be used." />
            <ChoiceCard selected={when === "on"} onClick={() => setWhen("on")} title="Going back on the charger" description="Just used, about to be charged." />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[#002a44] dark:text-white">Battery Beak screen</h2>
            <p className="mt-1 text-[#315979] dark:text-[#b8d2df]">Copy each value from the Beak, top to bottom.</p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-bold text-[#002a44] dark:text-white">Status</Label>
            <div className="grid grid-cols-2 gap-3">
              {statuses.map((option) => (
                <ChoiceCard key={option} selected={status === option} onClick={() => setStatus(option)} title={option} compact />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="charge" className="text-base font-bold text-[#002a44] dark:text-white">Charge</Label>
            <div className="relative">
              <Input id="charge" type="number" inputMode="decimal" min="0" value={charge} onChange={(event) => setCharge(event.target.value)} className="h-14 border-[#0086cb] bg-white pr-10 text-base dark:bg-[#102f47] dark:text-white" />
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg text-[#315979] dark:text-[#b8d2df]">%</span>
            </div>
            <p className="text-sm text-[#315979] dark:text-[#b8d2df]">Second line, after “Charge:”. It can be over 100%.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["v0", "v1", "v2", "ir"] as const).map((key) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key} className="uppercase text-sm font-bold text-[#002a44] dark:text-white">{key === "ir" ? "IR (mΩ)" : key}</Label>
                <Input id={key} type="number" inputMode="decimal" step="0.01" value={values[key]} onChange={(event) => updateValue(key, event.target.value)} className="h-12 border-[#9ecde7] bg-white dark:bg-[#102f47] dark:text-white" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-bold text-[#002a44] dark:text-white">Notes</Label>
            <Textarea id="notes" value={values.notes} onChange={(event) => updateValue("notes", event.target.value)} placeholder="Optional notes" className="min-h-24 border-[#9ecde7] bg-white dark:bg-[#102f47] dark:text-white" />
          </div>
        </section>

        <Button type="submit" size="lg" className="h-14 w-full bg-[#00517e] text-white hover:bg-[#003f61]">
          <Zap />
          Save reading
        </Button>
      </form>
    </main>
  );
}

function ChoiceCard({ selected, onClick, title, description, compact = false }: { selected: boolean; onClick: () => void; title: string; description?: string; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 text-left transition-colors ${compact ? "min-h-16" : "min-h-24"} ${selected ? "border-[#0086cb] bg-[#d8ecf8] dark:bg-[#164566]" : "border-[#b6d8ed] bg-[#eaf4fb] hover:bg-[#dff0fa] dark:border-[#1c5375] dark:bg-[#102f47] dark:hover:bg-[#164566]"}`}>
      <span>
        <span className="block text-lg font-semibold text-[#002a44] dark:text-white">{title}</span>
        {description ? <span className="mt-1 block text-[#315979] dark:text-[#b8d2df]">{description}</span> : null}
      </span>
      <span className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-[#0086cb] bg-[#0086cb] text-white" : "border-[#0086cb] text-transparent"}`}>
        {selected ? <Check className="size-4" /> : <Circle className="size-4" />}
      </span>
    </button>
  );
}
