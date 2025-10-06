import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import pt from './locales/pt.json'
import es from './locales/es.json'

// Supported languages
export const LANGS = [
  { code: 'en', native: 'English' },
  { code: 'pt', native: 'Português' },
  { code: 'es', native: 'Español' }
]

// Attempt persisted preference then browser language
const stored = typeof window !== 'undefined' ? localStorage.getItem('lang') : null
const browser = typeof window !== 'undefined' ? navigator.language.split('-')[0] : null
const supported = new Set(LANGS.map(l=> l.code))
const fallbackLng = 'en'
const initial = stored || (browser && supported.has(browser) ? browser : fallbackLng)

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es }
    },
  lng: initial,
    fallbackLng,
    interpolation: { escapeValue: false }
  })

export default i18n
