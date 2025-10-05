import { useTranslation } from 'react-i18next'
// LANGS removed pending central i18n module; derive from static list
import { useAppStore } from '../../state/store'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select'

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' }
]

// Language switcher using shadcn-style Select + abbreviated codes (EN/PT/ES)
export function LanguageSwitcher(){
  const { t, i18n } = useTranslation()
  const lang = useAppStore(s => s.language)
  const setLanguage = useAppStore(s => s.setLanguage)

  const onChange = (value:string) => {
    setLanguage(value)
    i18n.changeLanguage(value)
    try { localStorage.setItem('lang', value) } catch {}
  }

  return (
    <Select value={lang} onValueChange={onChange}>
      <SelectTrigger aria-label={t('actions.selectLanguage')} className="w-[78px] justify-between">
        <SelectValue placeholder="LANG" />
      </SelectTrigger>
      <SelectContent>
        {LANGS.map(l => (
          <SelectItem key={l.code} value={l.code}>{l.code.toUpperCase()}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher