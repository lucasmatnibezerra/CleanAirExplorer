import { Outlet, NavLink } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import { useEnterAnimation } from "@/hooks/useEnterAnimation";
import { TopBar } from "./TopBar";
import { useTranslation } from "react-i18next";
import { Icon } from "../ui/icons"; // <- remova esta linha e o iconMap se não existir

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

  // 🧠 Persistência do estado da sidebar (master)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("sidebar:collapsed");
    return stored === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <TopBar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((v) => !v)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 📐 Sidebar: animação suave do HEAD + persistência do master */}
        <aside
          aria-label="Sidebar navigation"
          aria-expanded={!collapsed}
          className={[
            // base visual
            "relative border-r border-border bg-card/60 backdrop-blur",
            // animação suave
            "transition-[width,transform,opacity] duration-300 ease-in-out will-change-[width,transform,opacity]",
            // altura total abaixo da topbar (h-14 = 56px)
            "h-[calc(100vh-56px)]",
            // layout interno
            "flex flex-col",
            // largura e visibilidade no mobile:
            //  - mobile colapsado: some com translate (suave)
            //  - mobile expandido: w-48
            collapsed
              ? "w-0 -translate-x-full opacity-0"
              : "w-48 translate-x-0 opacity-100",
            // no desktop nunca some; alterna largura (ícones-only vs expandida)
            collapsed
              ? "md:w-12 md:translate-x-0 md:opacity-100"
              : "md:w-52 md:translate-x-0 md:opacity-100",
          ].join(" ")}
        >
          {/* Cabeçalho da sidebar com botão de colapsar (master) */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-border">
            <span
              className={`text-[11px] font-semibold tracking-wide uppercase text-muted-foreground transition-opacity ${
                collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {t("layout.navigation", "Navigation")}
            </span>
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={
                collapsed
                  ? t("layout.expand", "Expand sidebar")
                  : t("layout.collapse", "Collapse sidebar")
              }
              aria-pressed={collapsed}
              className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
              title={
                collapsed
                  ? t("layout.expand", "Expand sidebar")
                  : t("layout.collapse", "Collapse sidebar")
              }
            >
              {/* usando o sistema de ícones do master; troque por um SVG se não tiver */}
              {collapsed ? (
                <Icon.chevronDown className="rotate-90 w-4 h-4" />
              ) : (
                <Icon.chevronDown className="-rotate-90 w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navegação */}
          <nav
            className="p-2 space-y-1 text-sm md:overflow-y-visible overflow-y-auto"
            aria-label="Primary"
          >
            <SidebarLink
              to="/"
              end
              collapsed={collapsed}
              label={t("nav.dashboard", "Dashboard")}
              icon="gauge"
            />
            <SidebarLink
              to="/trends"
              collapsed={collapsed}
              label={t("nav.trends", "Trends")}
              icon="chart"
            />
            <SidebarLink
              to="/stations"
              collapsed={collapsed}
              label={t("nav.stations", "Stations")}
              icon="layers"
            />
            <SidebarLink
              to="/settings"
              collapsed={collapsed}
              label={t("nav.settings", "Settings")}
              icon="settings"
            />
            <SidebarLink
              to="/about"
              collapsed={collapsed}
              label={t("nav.about", "About")}
              icon="info"
            />
          </nav>
        </aside>

        {/* Conteúdo */}
        <main
          ref={mainAnimRef}
          className="min-w-0 flex-1 overflow-auto px-3 sm:px-6 py-4"
        >
          <Suspense fallback={null}>
            <StationDrawer />
          </Suspense>
          <div className="mx-auto max-w-screen-2xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Descomente se quiser rodapé do master */}
      {/* <Footer /> */}
    </div>
  );
}

/* ===== Navegação: suporta tanto icon string (Icon system) quanto ReactNode ===== */

type SidebarLinkProps =
  | {
      to: string;
      end?: boolean;
      label: string;
      collapsed: boolean;
      icon: keyof typeof iconMap; // quando usar o sistema de ícones
    }
  | {
      to: string;
      end?: boolean;
      label: string;
      collapsed: boolean;
      icon: React.ReactNode; // quando quiser passar um SVG inline
    };

// Mapa de ícones do master (ajuste os nomes conforme seu Icon system)
const iconMap = {
  gauge: Icon?.gauge,
  chart: Icon?.chartDots ?? Icon?.chart, // fallback
  layers: Icon?.layers,
  settings: Icon?.settings,
  info: Icon?.info,
} as const;

function SidebarLink(props: SidebarLinkProps) {
  const { to, end, label, collapsed } = props;

  let IconComp: React.ReactNode = null;
  if (typeof (props as any).icon === "string") {
    const key = (props as any).icon as keyof typeof iconMap;
    const Cmp = iconMap[key];
    IconComp = Cmp ? <Cmp className="w-4 h-4" /> : null;
  } else {
    IconComp = <span className="shrink-0">{(props as any).icon}</span>;
  }

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
      {IconComp}
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
