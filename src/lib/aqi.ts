export function aqiColor(val: number) {
  if (val <= 50) return "#22c55e";
  if (val <= 100) return "#eab308";
  if (val <= 150) return "#f97316";
  if (val <= 200) return "#dc2626";
  return "#7e22ce";
}

export function aqiCategory(val: number) {
  if (val <= 50) return "Good";
  if (val <= 100) return "Moderate";
  if (val <= 150) return "Unhealthy (SG)"; // Sensitive groups
  if (val <= 200) return "Unhealthy";
  if (val <= 300) return "Very Unhealthy";
  return "Hazardous";
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
