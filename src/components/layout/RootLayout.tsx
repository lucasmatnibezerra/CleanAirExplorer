import { Outlet, NavLink } from 'react-router-dom'
import { Suspense, lazy, useState, useEffect } from 'react'
import { useEnterAnimation } from '../../hooks/useEnterAnimation'
import { TopBar } from './TopBar'
import { Icon } from '../ui/icons'
import { Footer } from './Footer'
import { useTranslation } from 'react-i18next'
const StationDrawer = lazy(() => import('../stations/StationDrawer').then(m => ({ default: m.StationDrawer })))

export function RootLayout() {
  const { t } = useTranslation()
  const mainAnimRef = useEnterAnimation<HTMLDivElement>({ translateY: 12, duration: 640, opacityFrom: 0 });
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if(typeof window === 'undefined') return false
    const stored = localStorage.getItem('sidebar:collapsed')
    return stored === '1'
  })
  useEffect(()=> {
    if(typeof window !== 'undefined'){
      localStorage.setItem('sidebar:collapsed', collapsed ? '1':'0')
    }
  },[collapsed])
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <TopBar />
  <div className="flex flex-1 min-h-0">
        <aside className={`group relative border-r border-border/60 bg-card/40 backdrop-blur-md p-3 hidden md:flex flex-col transition-[width] duration-300 ease-out ${collapsed ? 'w-16' : 'w-56'}`} aria-label="Sidebar navigation">
          <div className="flex items-center justify-between mb-4 text-sm font-semibold">
            <span className={`transition-opacity duration-200 text-muted-foreground tracking-wide uppercase text-[11px] ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>{t('layout.navigation','Navigation')}</span>
            <button
              onClick={() => setCollapsed(c => !c)}
              aria-label={collapsed ? t('layout.expand','Expand sidebar') : t('layout.collapse','Collapse sidebar')}
              aria-pressed={collapsed}
              className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-accent/60 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
            >
              {collapsed ? <Icon.chevronDown className="rotate-90 w-4 h-4" /> : <Icon.chevronDown className="-rotate-90 w-4 h-4" />}
            </button>
          </div>
          <nav className="space-y-1 text-sm flex-1" aria-label="Primary">
            <SidebarLink to="/" end collapsed={collapsed} label={t('nav.map','Map')} icon="chart-dots" />
            <SidebarLink to="/stations" collapsed={collapsed} label={t('nav.stations','Stations')} icon="building" />
            <SidebarLink to="/trends" collapsed={collapsed} label={t('nav.trends','Trends')} icon="trending" />
            <SidebarLink to="/settings" collapsed={collapsed} label={t('nav.forecast','Forecast')} icon="settings" />
            <SidebarLink to="/about" collapsed={collapsed} label={t('nav.about','About')} icon="info-circle" />
          </nav>
        </aside>
        <main ref={mainAnimRef} className="flex-1 overflow-y-auto px-4 py-10 md:py-12 will-change-transform">
          <div className="max-w-7xl mx-auto">
            <Suspense fallback={<p>Loading...</p>}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <Footer />
      <Suspense fallback={null}>
        <StationDrawer />
      </Suspense>
    </div>
  )
}

interface SidebarLinkProps {
  to: string
  end?: boolean
  label: string
  icon: string
  collapsed: boolean
}

const iconMap: Record<string, React.ComponentType<any>> = {
  'chart-dots': Icon.gauge,
  'building': Icon.layers,
  'trending': Icon.trendingUp,
  'settings': Icon.settings,
  'info-circle': Icon.info,
}

function SidebarLink({ to, end, label, icon, collapsed }: SidebarLinkProps){
  const IconComp = iconMap[icon] || Icon.info
  return (
    <NavLink
      to={to}
      end={end}
      className={({isActive}) =>
        `group/link flex items-center gap-3 rounded px-3 py-2 font-medium transition-colors whitespace-nowrap ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}`
      }
      title={collapsed ? label : undefined}
    >
      <IconComp className="w-4 h-4" />
      <span className={`transition-opacity duration-150 ${collapsed ? 'opacity-0 pointer-events-none -ml-2' : 'opacity-100'}`}>{label}</span>
    </NavLink>
  )
}
