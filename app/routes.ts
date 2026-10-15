import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/sign-in.tsx"),
  layout("routes/app-layout.tsx", [
    route("logging", "routes/logging.tsx"),
    route("statistics", "routes/statistics.tsx"),
    route("history", "routes/history.tsx"),
    route("statistics/battery", "routes/battery-deep-dive.tsx"),
    route("admin", "routes/admin.tsx"),
  ]),
] satisfies RouteConfig;
