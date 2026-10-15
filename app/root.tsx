import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { Toaster } from "@/components/ui/sonner";
import { AppDataProvider } from "./lib/app-data";

import "./app.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexEnabled = import.meta.env.VITE_ENABLE_CONVEX === "true";
const convexClient = convexEnabled && convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function meta() {
  return [
    { title: "FRC Battery Logger" },
    { name: "description", content: "Battery logging tools for FRC Team 341." },
  ];
}

export default function Root() {
  const content = <Outlet />;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {convexClient ? (
        <ConvexAuthProvider client={convexClient}><AppDataProvider convexEnabled>{content}</AppDataProvider></ConvexAuthProvider>
      ) : (
        <AppDataProvider convexEnabled={false}>{content}</AppDataProvider>
      )}
      <Toaster />
    </ThemeProvider>
  );
}
