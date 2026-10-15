import { LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAppData } from "../lib/app-data";

export function PageHeader({ dark = false }: { dark?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { displayName, signOut } = useAppData();
  const textClass = dark ? "text-white" : "text-[#002a44] dark:text-[#f7fbfd]";

  return (
    <header className={`flex items-center justify-between gap-3 border-b-2 pb-4 ${dark ? "border-[#00517e]" : "border-[#b6d8ed]"} ${textClass}`}>
      <div className="flex items-center gap-2">
        <img src="/team-341-logo.png" alt="Team 341" className="size-10 rounded-lg bg-[#fbdc0a] object-contain" />
        <div>
          <p className="font-black tracking-tight">Battery Logger</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {displayName ? <span className="hidden text-xs font-semibold sm:inline">{displayName}</span> : null}
        <Button
          variant="ghost"
          size="icon"
          className={dark ? "text-white hover:bg-white/10 hover:text-white" : "text-[#00517e] dark:text-[#f7fbfd]"}
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </Button>
        {displayName ? (
          <Button
            variant="ghost"
            size="icon"
            className={dark ? "text-white hover:bg-white/10 hover:text-white" : "text-[#00517e] dark:text-[#f7fbfd]"}
            aria-label="Sign out"
            onClick={() => void signOut()}
          >
            <LogOut />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
