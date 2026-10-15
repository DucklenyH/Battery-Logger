import { create } from "zustand";
import type { MemberRole } from "../lib/local-data";

type UiState = {
  isSignedIn: boolean;
  displayName: string;
  role: MemberRole;
  selectedBattery: string;
  signIn: (displayName: string, role: MemberRole) => void;
  signOut: () => void;
  setSelectedBattery: (battery: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSignedIn: false,
  displayName: "",
  role: "Member",
  selectedBattery: "",
  signIn: (displayName, role) => set({ displayName, role, isSignedIn: true }),
  signOut: () => set({ displayName: "", role: "Member", isSignedIn: false }),
  setSelectedBattery: (selectedBattery) => set({ selectedBattery }),
}));
