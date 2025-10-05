// @vitest-environment jsdom
import en from '../i18n/locales/en.json'
import pt from '../i18n/locales/pt.json'
import es from '../i18n/locales/es.json'

// Vitest provides global types when referenced via tsconfig. If still untyped, could add: /// <reference types="vitest" />
// (tsconfig likely already configured for tests.)

// Minimal sanity test to ensure recently added critical keys exist across locales
describe('i18n key presence', () => {
  const criticalKeys = [
    'aqi.good',
    'aqi.moderate',
    'aqi.unhealthySG',
    'aqi.unhealthy',
    'aqi.veryUnhealthy',
    'aqi.hazardous',
    'aqi.noData',
    'alerts.guidance.children',
    'alerts.guidance.older',
    'alerts.guidance.asthma',
    'footer.copyright'
  ] as const

  const locales: Record<string, Record<string, any>> = { en, pt, es }

  function has(obj: Record<string, any>, path: string){
    return path.split('.').reduce((acc, part) => acc != null ? acc[part] : undefined, obj) !== undefined
  }

  for(const [code, dict] of Object.entries(locales)){
    test(`locale ${code} has critical keys`, () => {
      for(const k of criticalKeys){
        expect(has(dict, k)).toBe(true)
      }
    })
  }
})