import { BatteryCharging, Clock3, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readLocalData, type LocalData, type LocalMatch, type LocalReading, writeLocalData } from "../lib/local-data";

export function meta() { return [{ title: "History · Battery Logger" }]; }

function totalVoltage(reading: LocalReading) { return [reading.v0, reading.v1, reading.v2].every((value) => value !== null) ? (reading.v0 ?? 0) + (reading.v1 ?? 0) + (reading.v2 ?? 0) : null; }
function display(value: number | null, suffix: string) { return value === null ? "—" : `${value.toFixed(2)}${suffix}`; }
function change(before: number | null, after: number | null, suffix: string) { return before === null || after === null ? "—" : `${display(before, suffix)} → ${display(after, suffix)}`; }
function trend(before: number | null, after: number | null): "positive" | "negative" | "neutral" { if (before === null || after === null || after === before) return "neutral"; return after > before ? "positive" : "negative"; }
function time(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
function getHistoryEntries(readings: LocalReading[]): Array<{ pre: LocalReading; post?: LocalReading }> {
  const entries: Array<{ pre: LocalReading; post?: LocalReading }> = [];
  const sorted = [...readings].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  let pending: LocalReading | undefined;
  for (const reading of sorted) {
    if (reading.when === "off") pending = reading;
    else if (reading.when === "on" && pending) { entries.push({ pre: pending, post: reading }); pending = undefined; }
  }
  if (pending) entries.push({ pre: pending });
  return entries;
}

function HistoryMetric({ label, value, delta, tone = "neutral" }: { label: string; value: string; delta: string; tone?: "positive" | "negative" | "neutral" }) {
  const toneClass = tone === "positive" ? "text-green-600 dark:text-green-400" : tone === "negative" ? "text-red-600 dark:text-red-400" : "text-[#315979] dark:text-[#b8d2df]";
  return <div className="rounded-xl border border-[#b6d8ed] bg-[#eaf4fb] p-3 dark:border-[#29415f] dark:bg-[#101d31]"><p className="text-[10px] font-bold uppercase tracking-wider text-[#315979] dark:text-[#b8d2df]">{label}</p><p className="mt-1 text-sm font-black text-[#002a44] dark:text-white">{value}</p><p className={`mt-1 text-[11px] ${toneClass}`}>{delta}</p></div>;
}

export default function History() {
  const [data, setData] = useState<LocalData>(() => readLocalData());
  const matches = data.batteries.flatMap((battery) => getHistoryEntries(data.readings.filter((reading) => reading.batteryId === battery.id)).map((entry) => ({ battery, entry }))).sort((a, b) => new Date(b.entry.post?.recordedAt ?? b.entry.pre.recordedAt).getTime() - new Date(a.entry.post?.recordedAt ?? a.entry.pre.recordedAt).getTime());
  function removeMatch(pre: LocalReading, post?: LocalReading) {
    const next = { ...data, readings: data.readings.filter((reading) => reading.id !== pre.id && reading.id !== post?.id) };
    setData(next); writeLocalData(next); toast.success("Match removed from local history");
  }
  function editMatch(pre: LocalReading, post: LocalReading) {
    const next = { ...data, readings: data.readings.map((reading) => reading.id === pre.id ? pre : reading.id === post.id ? post : reading) };
    setData(next); writeLocalData(next); toast.success("Match updated locally");
  }
  function editReading(reading: LocalReading) {
    const next = { ...data, readings: data.readings.map((item) => item.id === reading.id ? reading : item) };
    setData(next); writeLocalData(next); toast.success("Reading updated locally");
  }
  return <main className="mx-auto max-w-3xl py-8"><div className="mb-7 space-y-2"><h1 className="mt-0 text-3xl font-black tracking-tight text-[#002a44] dark:text-[#eef8ff] sm:text-4xl">Match history</h1><p className="text-[#315979] dark:text-[#a9c9df]">See how each battery changed from coming off the charger to going back on it.</p></div>{matches.length === 0 ? <Card><CardContent className="grid place-items-center gap-3 py-16 text-center text-sm text-[#315979] dark:text-[#b8d2df]"><BatteryCharging className="size-8 text-[#00517e] dark:text-[#65c6f7]" /><p>Completed matches will appear here after a pre-match and post-match reading are saved.</p></CardContent></Card> : <div className="space-y-4">{matches.map(({ battery, entry }) => <HistoryCard key={`${entry.pre.id}-${entry.post?.id ?? "pending"}`} batteryName={battery.name} entry={entry} onRemove={() => removeMatch(entry.pre, entry.post)} onEdit={editMatch} onEditReading={editReading} />)}</div>}</main>;
}

function HistoryCard({ batteryName, entry, onRemove, onEdit, onEditReading }: { batteryName: string; entry: { pre: LocalReading; post?: LocalReading }; onRemove: () => void; onEdit: (pre: LocalReading, post: LocalReading) => void; onEditReading: (reading: LocalReading) => void }) {
  const { pre, post } = entry; const preVoltage = totalVoltage(pre); const postVoltage = post ? totalVoltage(post) : null; const isPending = !post; const displayReading = (value: number | null, suffix: string) => value === null ? "—" : `${value.toFixed(2)}${suffix}`;
  return <Card><CardHeader className="relative"><div className="pr-24"><CardTitle className="text-xl text-[#002a44] dark:text-white">{batteryName}</CardTitle><span className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${isPending ? "bg-[#fff3c4] text-[#765b00] dark:bg-[#4b3b08] dark:text-[#fbdc0a]" : "bg-[#dff0fa] text-[#00517e] dark:bg-[#0b4564] dark:text-[#b8d2df]"}`}>{isPending && <Clock3 className="size-3" aria-hidden />}{isPending ? "Pending return" : `${post.eventName ?? "Event not recorded"} · Match ${post.matchNumber ?? "—"}`}</span></div><div className="absolute right-4 top-0 flex items-center gap-1 sm:right-6 sm:gap-2">{post ? <EditMatchDialog match={{ pre, post }} onSave={onEdit} /> : <EditReadingDialog reading={pre} onSave={onEditReading} />}<AlertDialog><AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Remove ${batteryName} reading`}><Trash2 className="size-4 text-red-600" /></Button>} /><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isPending ? "Remove this pending reading?" : "Remove this match?"}</AlertDialogTitle><AlertDialogDescription>{isPending ? "This removes the pending pre-match reading from local browser storage." : "This removes both readings for this match from local browser storage. This cannot be undone here."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 text-xs text-[#315979] dark:text-[#b8d2df] sm:grid-cols-2"><p>Pre-match: {time(pre.recordedAt)}</p>{post && <p>Post-match: {time(post.recordedAt)}</p>}</div><div className="grid gap-3 sm:grid-cols-3">{isPending ? <><HistoryMetric label="Voltage recorded" value={displayReading(preVoltage, "V")} delta="Waiting for post-match value" /><HistoryMetric label="Charge recorded" value={displayReading(pre.charge, "%")} delta="Waiting for post-match value" /><HistoryMetric label="IR recorded" value={displayReading(pre.ir, "mΩ")} delta="Waiting for post-match value" /></> : <><HistoryMetric label="Voltage" value={change(preVoltage, postVoltage, "V")} tone={trend(preVoltage, postVoltage)} delta={postVoltage !== null && preVoltage !== null ? `${(postVoltage - preVoltage >= 0 ? "+" : "")}${(postVoltage - preVoltage).toFixed(2)} V` : "No complete voltage data"} /><HistoryMetric label="Charge" value={change(pre.charge, post.charge, "%")} tone={trend(pre.charge, post.charge)} delta={pre.charge !== null && post.charge !== null ? `${(post.charge - pre.charge >= 0 ? "+" : "")}${(post.charge - pre.charge).toFixed(1)}%` : "No complete charge data"} /><HistoryMetric label="Internal resistance" value={change(pre.ir, post.ir, "mΩ")} tone={trend(pre.ir, post.ir)} delta={pre.ir !== null && post.ir !== null ? `${(post.ir - pre.ir >= 0 ? "+" : "")}${(post.ir - pre.ir).toFixed(2)} mΩ` : "No complete IR data"} /></>}</div></CardContent></Card>;
}

type ReadingForm = { status: LocalReading["status"]; charge: string; v0: string; v1: string; v2: string; ir: string };
function readingForm(reading: LocalReading): ReadingForm { return { status: reading.status, charge: reading.charge?.toString() ?? "", v0: reading.v0?.toString() ?? "", v1: reading.v1?.toString() ?? "", v2: reading.v2?.toString() ?? "", ir: reading.ir?.toString() ?? "" }; }
function numberOrNull(value: string) { return value.trim() === "" ? null : Number(value); }

function EditMatchDialog({ match, onSave }: { match: LocalMatch; onSave: (pre: LocalReading, post: LocalReading) => void }) {
  const [open, setOpen] = useState(false); const [pre, setPre] = useState(() => readingForm(match.pre)); const [post, setPost] = useState(() => readingForm(match.post));
  function startEditing() { setPre(readingForm(match.pre)); setPost(readingForm(match.post)); setOpen(true); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const update = (reading: LocalReading, form: ReadingForm): LocalReading => ({ ...reading, status: form.status, charge: numberOrNull(form.charge), v0: numberOrNull(form.v0), v1: numberOrNull(form.v1), v2: numberOrNull(form.v2), ir: numberOrNull(form.ir) }); onSave(update(match.pre, pre), update(match.post, post)); setOpen(false); }
  const updateForm = (which: "pre" | "post", key: keyof ReadingForm, value: string) => (which === "pre" ? setPre : setPost)((current) => ({ ...current, [key]: value }));
  return <Dialog open={open} onOpenChange={setOpen}><Button variant="ghost" size="icon" aria-label="Edit match" onClick={startEditing}><Pencil className="size-4" /></Button><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit match readings</DialogTitle><DialogDescription>Update the values recorded before and after the match.</DialogDescription></DialogHeader><form className="grid gap-5" onSubmit={submit}><ReadingFormFields label="Before match" form={pre} onChange={(key, value) => updateForm("pre", key, value)} /><ReadingFormFields label="After match" form={post} onChange={(key, value) => updateForm("post", key, value)} /><DialogFooter><Button type="submit">Save changes</Button></DialogFooter></form></DialogContent></Dialog>;
}

function EditReadingDialog({ reading, onSave }: { reading: LocalReading; onSave: (reading: LocalReading) => void }) {
  const [open, setOpen] = useState(false); const [form, setForm] = useState(() => readingForm(reading));
  function startEditing() { setForm(readingForm(reading)); setOpen(true); }
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); onSave({ ...reading, status: form.status, charge: numberOrNull(form.charge), v0: numberOrNull(form.v0), v1: numberOrNull(form.v1), v2: numberOrNull(form.v2), ir: numberOrNull(form.ir) }); setOpen(false); }
  return <Dialog open={open} onOpenChange={setOpen}><Button variant="ghost" size="icon" aria-label="Edit pending reading" onClick={startEditing}><Pencil className="size-4" /></Button><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit initial reading</DialogTitle><DialogDescription>Update the values recorded before the battery is returned to the charger.</DialogDescription></DialogHeader><form className="grid gap-5" onSubmit={submit}><ReadingFormFields label="Before match" form={form} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} /><DialogFooter><Button type="submit">Save changes</Button></DialogFooter></form></DialogContent></Dialog>;
}

function ReadingFormFields({ label, form, onChange }: { label: string; form: ReadingForm; onChange: (key: keyof ReadingForm, value: string) => void }) {
  return <fieldset className="grid gap-3 rounded-xl border border-[#b6d8ed] p-3 dark:border-[#29415f]"><legend className="px-1 text-sm font-bold text-[#002a44] dark:text-white">{label}</legend><Label>Status</Label><Select value={form.status} onValueChange={(value) => value && onChange("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Good">Good</SelectItem><SelectItem value="Fair">Fair</SelectItem><SelectItem value="Bad">Bad</SelectItem><SelectItem value="Charge Battery">Charge Battery</SelectItem></SelectContent></Select><div className="grid grid-cols-2 gap-3"><FieldInput label="Charge (%)" value={form.charge} onChange={(value) => onChange("charge", value)} /><FieldInput label="IR (mΩ)" value={form.ir} onChange={(value) => onChange("ir", value)} /><FieldInput label="Cell 1 (V)" value={form.v0} onChange={(value) => onChange("v0", value)} /><FieldInput label="Cell 2 (V)" value={form.v1} onChange={(value) => onChange("v1", value)} /><FieldInput label="Cell 3 (V)" value={form.v2} onChange={(value) => onChange("v2", value)} /></div></fieldset>;
}

function FieldInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div className="grid gap-1"><Label className="text-xs">{label}</Label><Input type="number" step="any" value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
