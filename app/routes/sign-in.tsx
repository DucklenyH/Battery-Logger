import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUiStore } from "../stores/ui-store";
import { upsertLocalMember } from "../lib/local-data";

export function meta() {
  return [{ title: "Sign in · Battery Logger" }];
}

export default function SignIn() {
  const navigate = useNavigate();
  const isSignedIn = useUiStore((state) => state.isSignedIn);
  const signIn = useUiStore((state) => state.signIn);
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");

  if (isSignedIn) return <Navigate to="/logging" replace />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = `${firstName.trim()} ${lastInitial.trim().toUpperCase()}`.trim();
    if (!firstName.trim() || !lastInitial.trim()) return;
    const member = upsertLocalMember(name);
    signIn(name, member.role);
    void navigate("/logging");
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[#eaf4fb] px-6 py-10 text-[#002a44]">
      <Card className="w-full max-w-sm border-2 border-[#b6d8ed] bg-white shadow-[0_18px_50px_rgb(0_55_92/0.12)]">
        <CardHeader className="items-center gap-4 text-center">
          <img src="/team-341-logo.png" alt="Team 341 mascot" className="size-20 rounded-2xl object-contain" />
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tight">BATTERY LOGGER</CardTitle>
            <p className="text-sm text-[#315979]">Sign in to start logging</p>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={submit}>
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-4">
              <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" autoFocus />
              </div>
              <div className="grid gap-2">
              <Label htmlFor="last-initial">Last initial</Label>
              <Input id="last-initial" value={lastInitial} onChange={(event) => setLastInitial(event.target.value.slice(0, 1))} maxLength={1} autoCapitalize="characters" />
              </div>
            </div>
            <Button type="submit" size="lg" className="mt-2 h-12 bg-[#00517e] text-white hover:bg-[#003f61]">
              Enter logger
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
