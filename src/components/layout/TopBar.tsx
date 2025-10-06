import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { requestNotificationPermission } from "@/notifications";
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import Logo from "@/assets/clean_air_logo.svg";

export function TopBar({
  onToggleSidebar,
  collapsed,
}: {
  onToggleSidebar: () => void;
  collapsed: boolean;
}) {
  const { t } = useTranslation(); // <— i18n
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setTimestamp(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b bg-card/60 backdrop-blur flex items-center px-4 h-14 gap-4">
      <button
        className="inline-flex items-center justify-center w-9 h-9 rounded border border-border hover:bg-accent/60"
        aria-label={
          collapsed
            ? t("layout.expand", "Expand sidebar")
            : t("layout.collapse", "Collapse sidebar")
        }
        onClick={onToggleSidebar}
        title={
          collapsed
            ? t("layout.expand", "Expand sidebar")
            : t("layout.collapse", "Collapse sidebar")
        }
      >
        {collapsed ? <SidebarOpenIcon /> : <SidebarCloseIcon />}
      </button>

      <div className="flex items-center gap-2 select-none min-w-0">
        <img
          src={Logo}
          alt="Clean Air"
          className="w-7 h-7 drop-shadow-sm shrink-0"
          loading="lazy"
        />
        <span className="font-semibold tracking-wide text-primary truncate">
          {t("app.title", "Clean Air Explorer")}
        </span>
        <span className="text-[10px] uppercase bg-indigo-600/70 text-white px-2 py-0.5 rounded border border-indigo-400/50 shrink-0">
          {t("badges.demo", "Demo")}
        </span>
      </div>

      <div className="hidden md:flex flex-col leading-tight text-[10px] text-muted-foreground">
        <span>{t("topbar.mockLocation", "Belém, PA (mock location)")}</span>
        <span className="text-foreground/70">
          {t("topbar.updated", "Updated {{time}}", { time: timestamp })}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher /> {/* <— seu componente; mantém todos os idiomas */}
        <button
          className="inline-flex items-center justify-center w-9 h-9 rounded border border-border hover:bg-accent/60"
          aria-label={t("actions.enableAlerts", "Enable alerts")}
          title={t("actions.enableAlerts", "Enable alerts")}
          onClick={handleEnableAlerts}
        >
          <BellIcon />
        </button>
        <DarkModeToggle />
      </div>
    </header>
  );
}

async function handleEnableAlerts() {
  const status = await requestNotificationPermission();
  if (status === "granted") alert("Notifications enabled (mock subscription).");
  else if (status === "denied")
    alert("Notifications denied. You can adjust this in browser settings.");
  else alert("Notification permission dismissed.");
}

// Ícones locais
function SidebarCloseIcon() {
  /* (igual a antes) */ return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="8" y1="4" x2="8" y2="20" />
      <polyline points="13,8 10,12 13,16" />
    </svg>
  );
}
function SidebarOpenIcon() {
  /* (igual a antes) */ return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="8" y1="4" x2="8" y2="20" />
      <polyline points="11,8 14,12 11,16" />
    </svg>
  );
}
function BellIcon() {
  /* (igual a antes) */ return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 0 0-12 0v3.2c0 .53-.21 1.04-.6 1.4L4 17h5" />
      <path d="M10 17a2 2 0 0 0 4 0" />
    </svg>
  );
}
