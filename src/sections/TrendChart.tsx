import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import type { HistoricalSeries } from '../api/schemas'

export default function TrendChart({ series }: { series: HistoricalSeries }){
  return (
    <ResponsiveContainer width="100%" height="100%">
  <LineChart data={series.points} margin={{ left:24, right:24, top:16, bottom:28 }}>
        <XAxis dataKey="ts" tickFormatter={(v)=> new Date(v).getHours()+':00'} interval={3} stroke="#64748b" fontSize={10} />
        <YAxis stroke="#64748b" fontSize={10} />
        <Tooltip labelFormatter={(v)=> new Date(v as number).toLocaleString()} />
        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
