import React from 'react'
import i18n from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { initReactI18next } from 'react-i18next'
import en from '../i18n/locales/en.json'

// Minimal isolated instance for tests to avoid polluting the main one.
const testI18n = i18n.createInstance()
void testI18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export function withI18n(ui: React.ReactElement){
  return <I18nextProvider i18n={testI18n}>{ui}</I18nextProvider>
}

export { testI18n }
