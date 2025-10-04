import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { requestNotificationPermission } from '../../notifications'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'
import Logo from '@/assets/clean_air_logo.svg'

export function TopBar(){
  const [open, setOpen] = useState(false)
  const [timestamp, setTimestamp] = useState<string>('')
  useEffect(()=>{
    const update = ()=> setTimestamp(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}))
    update()
    const id = setInterval(update, 60_000)
    return ()=> clearInterval(id)
  },[])
  return (
    <header className="border-b border-slate-700/60 bg-slate-900/60 backdrop-blur flex items-center px-4 h-14 gap-4">
      <button className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded hover:bg-slate-700/50" aria-label="Toggle navigation" onClick={()=>setOpen(o=>!o)}>
        <span className="i-tabler-menu-2" />
      </button>
      <div className="flex items-center gap-2 select-none">
        <img src={Logo} alt="Clean Air" className="w-7 h-7 drop-shadow-sm" loading="lazy" />
        <span className="font-semibold tracking-wide text-sky-300">Clean Air Explorer</span>
        <span className="text-[10px] uppercase bg-indigo-600/70 text-white px-2 py-0.5 rounded border border-indigo-400/50">Demo</span>
      </div>
      <div className="hidden md:flex flex-col leading-tight text-[10px] text-slate-400">
        <span>Belém, PA (mock location)</span>
        <span className="text-slate-500">Updated {timestamp}</span>
      </div>
      {/* Desktop nav removed (sidebar already provides navigation) */}
  <div className="ml-auto flex items-center gap-3">
    <DarkModeToggle />
	<button className="text-xs px-3 py-1 rounded bg-sky-600/80 hover:bg-sky-500 focus-visible:outline focus-visible:outline-sky-400 shadow-sm" onClick={handleEnableAlerts}>Enable Alerts</button>
  </div>
      {open && (
        <div className="absolute top-14 left-0 right-0 bg-slate-900 border-b border-slate-700/60 p-4 flex flex-col gap-2 md:hidden">
          <NavLink onClick={()=>setOpen(false)} to="/" end className={({isActive}) => mobileLink(isActive)}>Dashboard</NavLink>
          <NavLink onClick={()=>setOpen(false)} to="/stations" className={({isActive}) => mobileLink(isActive)}>Stations</NavLink>
          <NavLink onClick={()=>setOpen(false)} to="/settings" className={({isActive}) => mobileLink(isActive)}>Settings</NavLink>
          <NavLink onClick={()=>setOpen(false)} to="/about" className={({isActive}) => mobileLink(isActive)}>About</NavLink>
        </div>
      )}
    </header>
  )
}

function mobileLink(active:boolean){
  return `block px-3 py-2 rounded ${active? 'bg-slate-700 text-white':'text-slate-300 hover:text-white hover:bg-slate-700/50'}`
}

async function handleEnableAlerts(){
  const status = await requestNotificationPermission()
  if(status === 'granted'){
    alert('Notifications enabled (mock subscription).')
  } else if(status === 'denied') {
    alert('Notifications denied. You can adjust this in browser settings.')
  } else {
    alert('Notification permission dismissed.')
  }
}
