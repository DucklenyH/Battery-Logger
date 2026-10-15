export type MemberRole = "Mentor" | "Subsystem Leader" | "Member";
export type BatteryKind = "Demo" | "Competition";
export type BatteryStatus = "Active" | "Retired";
export type EventType = "Competition" | "Demo" | "Practice";
export type EventStatus = "Active" | "Closed";

export type BatteryRecord = {
  id: string;
  name: string;
  kind: BatteryKind;
  status: BatteryStatus;
  createdAt: string;
};

export type EventRecord = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: EventType;
  status: EventStatus;
};

export type TeamMember = {
  id: string;
  name: string;
  role: MemberRole;
  joinedAt: string;
};

export type LocalReading = {
  id: string;
  batteryId: string;
  batteryName: string;
  when: "off" | "on";
  status: "Good" | "Fair" | "Bad" | "Charge Battery";
  charge: number | null;
  v0: number | null;
  v1: number | null;
  v2: number | null;
  ir: number | null;
  notes: string;
  recordedAt: string;
  eventId?: string;
  eventName?: string;
  matchNumber?: number;
};

export type LocalMatch = { pre: LocalReading; post: LocalReading };

export type LocalData = {
  batteries: BatteryRecord[];
  events: EventRecord[];
  members: TeamMember[];
  readings: LocalReading[];
};

const STORAGE_KEY = "battery-logger-local-data-v1";

function createId(prefix: string) {
  return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`;
}

const initialData: LocalData = {
  batteries: [],
  events: [],
  members: [
    {
      id: "member-declan-h",
      name: "Declan H",
      role: "Mentor",
      joinedAt: new Date().toISOString(),
    },
  ],
  readings: [],
};

export function readLocalData(): LocalData {
  if (typeof window === "undefined") return initialData;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;

  try {
    const parsed = JSON.parse(saved) as Partial<LocalData>;
    return {
      batteries: Array.isArray(parsed.batteries) ? parsed.batteries : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
      members: Array.isArray(parsed.members) ? parsed.members : [],
      readings: Array.isArray(parsed.readings) ? parsed.readings : [],
    };
  } catch {
    return initialData;
  }
}

export function writeLocalData(data: LocalData) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function upsertLocalMember(name: string): TeamMember {
  const data = readLocalData();
  const normalizedName = name.trim().replace(/\s+/g, " ");
  const existing = data.members.find((member) => member.name.toLowerCase() === normalizedName.toLowerCase());
  if (existing) return existing;

  const member: TeamMember = {
    id: createId("member"),
    name: normalizedName,
    role: normalizedName.toLowerCase() === "declan h" ? "Mentor" : "Member",
    joinedAt: new Date().toISOString(),
  };
  writeLocalData({ ...data, members: [...data.members, member] });
  return member;
}

export function getMemberRole(name: string): MemberRole {
  return readLocalData().members.find((member) => member.name.toLowerCase() === name.trim().toLowerCase())?.role ?? "Member";
}

export function makeLocalId(prefix: string) {
  return createId(prefix);
}

export function getCompletedMatches(readings: LocalReading[]): LocalMatch[] {
  const matches: LocalMatch[] = [];
  let preReading: LocalReading | undefined;
  for (const reading of readings) {
    if (reading.when === "off") preReading = reading;
    if (reading.when === "on" && preReading) {
      matches.push({ pre: preReading, post: reading });
      preReading = undefined;
    }
  }
  return matches;
}

export function generateLocalHistory(data: LocalData, matchesPerBattery = 10): LocalData {
  const generated: LocalReading[] = [];
  const event = data.events[0];
  data.batteries.forEach((battery, batteryIndex) => {
    const existingMatches = getCompletedMatches(data.readings.filter((reading) => reading.batteryId === battery.id));
    const missing = Math.max(0, matchesPerBattery - existingMatches.length);
    for (let index = 0; index < missing; index += 1) {
      const matchNumber = existingMatches.length + index + 1;
      const recordedAt = new Date(Date.now() - (missing - index) * 86_400_000).toISOString();
      const preCharge = 100 + ((batteryIndex + index) % 4) * 5;
      const postCharge = Math.max(45, preCharge - 35 - ((batteryIndex + index) % 3) * 4);
      const baseVoltage = 12.6 - batteryIndex * 0.08 - index * 0.02;
      const preIr = 4 + batteryIndex * 0.3 + index * 0.08;
      const postIr = preIr + 0.4 + (index % 3) * 0.12;
      const common = { batteryId: battery.id, batteryName: battery.name, eventId: event?.id, eventName: event?.name ?? "Generated local event", matchNumber, notes: "Generated local history", recordedAt };
      generated.push({ ...common, id: makeLocalId("reading"), when: "off", status: "Good", charge: preCharge, v0: baseVoltage / 3, v1: baseVoltage / 3, v2: baseVoltage / 3, ir: preIr });
      generated.push({ ...common, id: makeLocalId("reading"), when: "on", status: postIr < 6 ? "Good" : "Fair", charge: postCharge, v0: (baseVoltage - 0.12) / 3, v1: (baseVoltage - 0.12) / 3, v2: (baseVoltage - 0.12) / 3, ir: postIr, recordedAt: new Date(new Date(recordedAt).getTime() + 3_600_000).toISOString() });
    }
  });
  return { ...data, readings: [...data.readings, ...generated] };
}
