import { useTranslation } from 'react-i18next'

export function Footer(){
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  return (
    <footer className="text-xs text-center py-4 text-muted-foreground border-t border-border relative">
      {t('footer.copyright','© {{year}} Clean Air Explorer – Built for NASA Space Apps',{ year })}
    </footer>
  )
}

export default Footer