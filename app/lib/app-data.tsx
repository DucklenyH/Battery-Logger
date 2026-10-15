import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { readLocalData, type LocalData, type MemberRole, upsertLocalMember, writeLocalData } from "./local-data";
import { useUiStore } from "../stores/ui-store";

type Credentials = { email: string; password: string; name?: string; flow: "signIn" | "signUp" };
type AppDataContext = {
  data: LocalData | null; loading: boolean; isConfigured: boolean; isAuthenticated: boolean;
  displayName: string; role: MemberRole; replaceData: (next: LocalData) => Promise<void>;
  signInWithPassword: (credentials: Credentials) => Promise<void>; signOut: () => Promise<void>;
};
const Context = createContext<AppDataContext | null>(null);

export function useAppData() { const value = useContext(Context); if (!value) throw new Error("useAppData must be used inside AppDataProvider"); return value; }

function LocalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LocalData>(() => readLocalData());
  const displayName = useUiStore((state) => state.displayName); const role = useUiStore((state) => state.role); const isAuthenticated = useUiStore((state) => state.isSignedIn);
  const replaceData = async (next: LocalData) => { setData(next); writeLocalData(next); };
  const signInWithPassword = async ({ name = "", flow }: Credentials) => { if (flow !== "signUp") return; const member = upsertLocalMember(name); useUiStore.getState().signIn(member.name, member.role); setData(readLocalData()); };
  const signOut = async () => useUiStore.getState().signOut();
  return <Context.Provider value={{ data, loading: false, isConfigured: false, isAuthenticated, displayName, role, replaceData, signInWithPassword, signOut }}>{children}</Context.Provider>;
}

function ConvexProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth(); const { signIn, signOut: convexSignOut } = useAuthActions();
  const snapshot = useQuery(api.data.get, isAuthenticated ? {} : "skip"); const replaceMutation = useMutation(api.data.replaceData); const ensureMember = useMutation(api.data.ensureMember);
  const [migrationStarted, setMigrationStarted] = useState(false);
  const data = snapshot ? { batteries: snapshot.batteries, events: snapshot.events, members: snapshot.members, readings: snapshot.readings } : null;
  const currentMember = snapshot?.currentMember ?? null;
  useEffect(() => {
    if (!isAuthenticated || !snapshot || migrationStarted) return;
    setMigrationStarted(true);
    const local = readLocalData(); const hasRemoteData = snapshot.batteries.length > 0 || snapshot.events.length > 0 || snapshot.readings.length > 0;
    const migrated = window.localStorage.getItem("battery-logger-convex-migrated-v1");
    void (async () => {
      if (!currentMember) await ensureMember({ name: local.members[0]?.name ?? "Team member" });
      if (!migrated && !hasRemoteData && (local.batteries.length || local.events.length || local.readings.length)) await replaceMutation({ batteries: local.batteries, events: local.events, members: [], readings: local.readings });
      window.localStorage.setItem("battery-logger-convex-migrated-v1", "true");
    })();
  }, [currentMember, ensureMember, isAuthenticated, migrationStarted, replaceMutation, snapshot]);
  const replaceData = async (next: LocalData) => { await replaceMutation(next); };
  const signInWithPassword = async ({ email, password, name, flow }: Credentials) => { await signIn("password", { email, password, flow, name: name ?? "" }); };
  const value = { data, loading: isAuthenticated && snapshot === undefined, isConfigured: true, isAuthenticated, displayName: currentMember?.name ?? "", role: currentMember?.role ?? "Member", replaceData, signInWithPassword, signOut: async () => { await convexSignOut(); } };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function AppDataProvider({ children, convexEnabled }: { children: ReactNode; convexEnabled: boolean }) { return convexEnabled ? <ConvexProvider>{children}</ConvexProvider> : <LocalProvider>{children}</LocalProvider>; }
