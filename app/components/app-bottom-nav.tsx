import { BarChart3, ClipboardPenLine, History as HistoryIcon, Settings2 } from "lucide-react";
import { NavLink } from "react-router";
import { useUiStore } from "../stores/ui-store";

const links = [
  { to: "/logging", label: "Logging", icon: ClipboardPenLine },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/history", label: "History", icon: HistoryIcon },
  { to: "/admin", label: "Admin", icon: Settings2 },
];

export function AppBottomNav() {
  const role = useUiStore((state) => state.role);
  const visibleLinks = role === "Member" ? links.filter((link) => link.to !== "/admin") : links;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#b6d8ed] bg-[#eaf4fb]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-6px_22px_rgb(0_55_92/0.08)] backdrop-blur dark:border-[#1c5375] dark:bg-[#071827]/95 dark:shadow-[0_-6px_22px_rgb(0_0_0/0.28)]">
      <div className={`mx-auto grid max-w-xl gap-2 ${visibleLinks.length === 2 ? "grid-cols-2" : visibleLinks.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-[#00517e] text-white shadow-sm"
                  : "text-[#315979] hover:bg-[#d8ecf8] dark:text-[#a9c9df] dark:hover:bg-[#10253a]"
              }`
            }
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
