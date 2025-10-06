import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { HistoricalSeries } from "../api/schemas";

export default function TrendChart({ series }: { series: HistoricalSeries }) {
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const lineColor = isDark ? "#38bdf8" : "#2563eb";

  const tooltipBg = isDark ? "#0b1220" : "#ffffff";
  const tooltipText = isDark ? "#e2e8f0" : "#0f172a";
  const tooltipBorder = isDark ? "#1e293b" : "#e2e8f0";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={series.points}
        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
      >
        <XAxis
          dataKey="ts"
          tickFormatter={(v) => new Date(v).getHours() + ":00"}
          interval={3}
          stroke="#64748b"
          fontSize={10}
        />
        <YAxis stroke="#64748b" fontSize={10} />
        <Tooltip
          labelFormatter={(v) => new Date(v as number).toLocaleString()}
        />

        <Tooltip
          labelFormatter={(v) => new Date(v as number).toLocaleString()}
          contentStyle={{
            backgroundColor: tooltipBg,
            color: tooltipText,
            border: `1px solid ${tooltipBorder}`,
            borderRadius: 8,
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,.4)"
              : "0 8px 24px rgba(0,0,0,.08)",
          }}
        />

        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: tooltipBg, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
