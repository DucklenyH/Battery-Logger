import { Navigate, Outlet, useLocation } from "react-router";

import { AppBottomNav } from "../components/app-bottom-nav";
import { PageHeader } from "../components/page-header";
import { useAppData } from "../lib/app-data";

export default function AppLayout() {
  const { isAuthenticated, role, loading } = useAppData();
  const location = useLocation();
  if (loading) return <div className="grid min-h-svh place-items-center bg-background text-foreground">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/" replace />;
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
