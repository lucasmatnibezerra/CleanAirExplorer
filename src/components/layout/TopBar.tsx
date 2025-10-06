import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { requestNotificationPermission } from '../../notifications'
import { DarkModeToggle } from '../ui/dark-mode-toggle'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'
import Logo from '../../assets/clean_air_logo.svg'
import { Icon } from '../ui/icons'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export function TopBar(){
  const [open, setOpen] = useState(false)
  const [timestamp, setTimestamp] = useState<string>('')
  const { t } = useTranslation()
  useEffect(()=>{
    const update = ()=> setTimestamp(new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}))
    update()
    const id = setInterval(update, 60_000)
    return ()=> clearInterval(id)
  },[])
  return (
    <header className="relative z-40 border-b border-border/60 bg-card/60 backdrop-blur flex items-center px-4 h-14 gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={open ? t('actions.closeMenu', 'Close menu') : t('actions.openMenu', 'Open menu')}
        aria-pressed={open}
        onClick={()=>setOpen(o=>!o)}
      >
        <Icon.menu className="w-5 h-5" />
      </Button>
      <div className="flex items-center gap-2 select-none">
        <img src={Logo} alt="Clean Air" className="w-7 h-7 drop-shadow-sm" loading="lazy" />
	<span className="font-semibold tracking-wide text-sky-300">{t('app.title')}</span>
	<Badge variant="outline" className="uppercase tracking-wide bg-indigo-600/70 border-indigo-400/50 text-[10px] text-white">Demo</Badge>
      </div>
      <div className="hidden md:flex flex-col leading-tight text-[10px] text-slate-400">
	<span>Belém, PA (mock)</span>
	<span className="text-slate-500">{t('forecast.loading').replace('…','')} {timestamp}</span>
      </div>
      {/* Desktop nav removed (sidebar already provides navigation) */}
	<div className="ml-auto flex items-center gap-2">
	  <LanguageSwitcher />
	  <DarkModeToggle />
    <Button size="sm" variant="primary" className="inline-flex items-center gap-1" onClick={handleEnableAlerts} aria-label={t('actions.enableAlerts','Enable alerts')}>
		<Icon.bell className="w-4 h-4" />
		<span className="hidden sm:inline">{t('actions.alerts','Alerts')}</span>
	  </Button>
	</div>
      {open && (
        <>
          {/* Backdrop for mobile menu */}
          <div
            className="fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm md:hidden animate-in fade-in-0"
            aria-hidden="true"
            onClick={()=>setOpen(false)}
          />
          <nav
            aria-label={t('nav.title','Navigation')}
            className="absolute top-14 left-0 right-0 z-40 bg-slate-900/95 border-b border-slate-700/60 p-4 flex flex-col gap-1 md:hidden shadow-lg animate-in slide-in-from-top-2"
          >
            <NavLink onClick={()=>setOpen(false)} to="/" end className={({isActive}) => mobileLink(isActive)}>{t('nav.map')}</NavLink>
            <NavLink onClick={()=>setOpen(false)} to="/stations" className={({isActive}) => mobileLink(isActive)}>{t('nav.stations')}</NavLink>
            <NavLink onClick={()=>setOpen(false)} to="/settings" className={({isActive}) => mobileLink(isActive)}>{t('nav.forecast')}</NavLink>
            <NavLink onClick={()=>setOpen(false)} to="/about" className={({isActive}) => mobileLink(isActive)}>{t('nav.about', 'About')}</NavLink>
          </nav>
        </>
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
