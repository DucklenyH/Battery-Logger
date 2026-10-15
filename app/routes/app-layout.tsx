import { Navigate, Outlet, useLocation } from "react-router";

import { AppBottomNav } from "../components/app-bottom-nav";
import { PageHeader } from "../components/page-header";
import { useUiStore } from "../stores/ui-store";

export default function AppLayout() {
  const isSignedIn = useUiStore((state) => state.isSignedIn);
  const role = useUiStore((state) => state.role);
  const location = useLocation();
  if (!isSignedIn) return <Navigate to="/" replace />;
  if (location.pathname.startsWith("/admin") && role === "Member") return <Navigate to="/logging" replace />;

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-5 sm:px-8">
        <PageHeader />
        <Outlet />
      </div>
      <AppBottomNav />
    </div>
  );
}
