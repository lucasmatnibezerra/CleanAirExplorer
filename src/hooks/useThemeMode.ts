import { useEffect, useState } from "react";

export function useThemeMode() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    update();

    // observa mudanças na classe "dark"
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
