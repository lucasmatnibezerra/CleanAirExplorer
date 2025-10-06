// src/components/layout/RootLayout.tsx
import { Outlet, NavLink } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import { useEnterAnimation } from "@/hooks/useEnterAnimation";
import { TopBar } from "./TopBar";
import { useTranslation } from "react-i18next";

const StationDrawer = lazy(() =>
  import("../stations/StationDrawer").then((m) => ({
    default: m.StationDrawer,
  }))
);

export function RootLayout() {
  const { t } = useTranslation();
  const mainAnimRef = useEnterAnimation<HTMLDivElement>({
    translateY: 12,
    duration: 640,
    opacityFrom: 0,
  });

  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors overflow-x-hidden">
      <TopBar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden relative z-0">
        <aside
          aria-label={t("layout.navigation", "Navigation")}
          aria-expanded={!collapsed}
          className={[
            "relative shrink-0 border-r border-border bg-card/60 backdrop-blur",
            "transition-[width,transform,opacity] duration-300 ease-in-out will-change-[width,transform,opacity]",
            "h-[calc(100vh-56px)]",
            "flex flex-col",
            collapsed
              ? "w-0 -translate-x-full opacity-0"
              : "w-48 translate-x-0 opacity-100",
            collapsed
              ? "md:w-12 md:translate-x-0 md:opacity-100"
              : "md:w-52 md:translate-x-0 md:opacity-100",
          ].join(" ")}
        >
          <nav className="p-2 space-y-1 text-sm md:overflow-y-visible overflow-y-auto">
            <SidebarLink
              to="/"
              label={t("nav.dashboard", "Dashboard")}
              icon={<DashboardIcon />}
              collapsed={collapsed}
              end
            />
            {/* <SidebarLink
              to="/trends"
              label={t("nav.trends", "Trends")}
              icon={<TrendsIcon />}
              collapsed={collapsed}
            /> */}
            <SidebarLink
              to="/stations"
              label={t("nav.stations", "Stations")}
              icon={<StationsIcon />}
              collapsed={collapsed}
            />
            <SidebarLink
              to="/settings"
              label={t("nav.settings", "Settings")}
              icon={<SettingsIcon />}
              collapsed={collapsed}
            />
            <SidebarLink
              to="/about"
              label={t("nav.about", "About")}
              icon={<InfoIcon />}
              collapsed={collapsed}
            />
          </nav>
        </aside>

        <main
          ref={mainAnimRef}
          className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4"
        >
          <Suspense fallback={null}>
            <StationDrawer />
          </Suspense>
          <div className="mx-auto max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  collapsed,
  end,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "group/link flex items-center gap-2 rounded px-2.5 py-2",
          "transition-colors duration-200",
          isActive
            ? "bg-accent/70 text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      <span
        className={`whitespace-nowrap transition-[opacity,margin] duration-200 min-w-0 ${
          collapsed ? "opacity-0 -ml-2 pointer-events-none" : "opacity-100"
        }`}
      >
        {label}
      </span>
    </NavLink>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="4" />
      <rect x="14" y="10" width="7" height="11" />
      <rect x="3" y="12" width="7" height="9" />
    </svg>
  );
}
function TrendsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3,17 9,11 13,15 21,7" />
      <circle cx="21" cy="7" r="1" />
      <circle cx="13" cy="15" r="1" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="3" cy="17" r="1" />
    </svg>
  );
}
function StationsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21s6-4.35 6-9a6 6 0 1 0-12 0c0 4.65 6 9 6 9z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.07a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.07a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.07a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.39 1.26 1 1.51H21a2 2 0 0 1 0 4h-.07c-.7.25-1.2.85-1.53 1.49z" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
      <line x1="11" y1="12" x2="13" y2="12" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  );
}
