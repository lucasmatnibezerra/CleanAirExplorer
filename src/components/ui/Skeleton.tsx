export function Skeleton({ className='' }: { className?: string }){
  return <div className={`animate-pulse rounded bg-slate-700/40 ${className}`} />
}

export function SkeletonText({ lines=3 }: { lines?: number }){
  return (
    <div className="space-y-2">
      {Array.from({length: lines}).map((_,i)=>(
        <Skeleton key={i} className="h-3" />
      ))}
    </div>
  )
}
