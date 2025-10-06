export function aqiColor(val: number) {
  if (val <= 50) return "#22c55e"; // green-500
  if (val <= 100) return "#eab308"; // yellow-500
  if (val <= 150) return "#f97316"; // orange-500
  if (val <= 200) return "#dc2626"; // red-600
  return "#7e22ce"; // purple-700
}

export type AqiCategoryKey =
  | "aqi.good"
  | "aqi.moderate"
  | "aqi.unhealthySG"
  | "aqi.unhealthy"
  | "aqi.veryUnhealthy"
  | "aqi.hazardous";

function aqiKey(val: number): AqiCategoryKey {
  if (val <= 50) return "aqi.good";
  if (val <= 100) return "aqi.moderate";
  if (val <= 150) return "aqi.unhealthySG"; // Sensitive groups
  if (val <= 200) return "aqi.unhealthy";
  if (val <= 300) return "aqi.veryUnhealthy";
  return "aqi.hazardous";
}

function aqiLabelFromKey(key: AqiCategoryKey): string {
  switch (key) {
    case "aqi.good":
      return "Good";
    case "aqi.moderate":
      return "Moderate";
    case "aqi.unhealthySG":
      return "Unhealthy (SG)";
    case "aqi.unhealthy":
      return "Unhealthy";
    case "aqi.veryUnhealthy":
      return "Very Unhealthy";
    case "aqi.hazardous":
      return "Hazardous";
  }
}
export function aqiCategory(val: number, opts?: { key?: boolean }): string {
  const key = aqiKey(val);
  if (opts?.key) return key;
  return aqiLabelFromKey(key);
}

export function aqiBadgeClass(val: number): string {
  if (val <= 50) {
    // Good
    return "bg-green-500 text-slate-900 dark:text-white";
  }
  if (val <= 100) {
    // Moderate
    return "bg-yellow-400 text-slate-900 dark:bg-yellow-600 dark:text-white";
  }
  if (val <= 150) {
    // Sensitive
    return "bg-orange-500 text-white";
  }
  if (val <= 200) {
    // Unhealthy
    return "bg-red-600 text-white";
  }
  if (val <= 300) {
    // Very Unhealthy
    return "bg-purple-700 text-white";
  }
  return "bg-red-800 text-white";
}
