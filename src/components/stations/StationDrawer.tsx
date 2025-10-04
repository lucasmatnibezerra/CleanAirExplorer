import { useAppStore } from '../../state/store'
import { useStations, useHistoricalSeries } from '../../api/hooks'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '../ui/sheet'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { aqiBadgeClass, aqiCategory, aqiColor } from '../../lib/aqi'

export function StationDrawer(){
  const stationId = useAppStore(s => s.selectedStationId)
  const setSelected = useAppStore(s => s.setSelectedStation)
  const { data: stations } = useStations()
  const station = stations?.find(s => s.id === stationId)
  const { data: historical } = useHistoricalSeries(stationId, 'PM2.5')
  useEffect(()=>{/* placeholder for future side-effects */}, [stationId])
  return (
    <Sheet open={!!station} onOpenChange={(open)=> !open && setSelected(null)}>
      <SheetContent side="bottom" className="max-h-[60vh] flex flex-col gap-3">
        {station && (
          <>
            <SheetHeader className="text-left space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle>{station.name}</SheetTitle>
                <Badge variant="outline" className={aqiBadgeClass(station.latestAQI)}>{aqiCategory(station.latestAQI)}</Badge>
              </div>
              <SheetDescription className="text-xs">{station.location.lat.toFixed(2)}, {station.location.lon.toFixed(2)}</SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric label="AQI" value={station.latestAQI.toString()} color={aqiColor(station.latestAQI)} />
              <Metric label="PM2.5" value={(12+Math.random()*15).toFixed(1)} />
              <Metric label="NO₂" value={(15+Math.random()*20).toFixed(0)} />
            </div>
            <div className="text-xs space-y-1 overflow-auto">
              <p className="text-muted-foreground">Mock recent points (PM2.5):</p>
              <div className="flex gap-1 flex-wrap">
                {historical?.points.slice(-12).map(p => (
                  <span key={p.ts} className="px-1 py-0.5 rounded bg-muted text-muted-foreground/90">{p.value}</span>
                ))}
              </div>
            </div>
            <div className="mt-auto flex justify-between text-xs pt-2 border-t border-border/60">
              <Link to={`/trends?station=${station.id}`} className="text-primary hover:underline">View Trends →</Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={()=> alert('Bookmark (mock)')}>☆ Bookmark</Button>
                <SheetClose asChild>
                  <Button variant="ghost" size="sm">Close</Button>
                </SheetClose>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Metric({label, value, color}:{label:string; value:string; color?:string}){
  return (
    <div className="rounded-md bg-muted/60 p-2 flex flex-col">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold" style={color? {color}:{}}>{value}</span>
    </div>
  )
}

