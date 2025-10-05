import React from 'react'
import i18n from 'i18next'
import type { i18n as I18nInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import en from '../i18n/locales/en.json'

// Provide a minimal subset of translations necessary for layer buttons & map UI to eliminate warnings.
// We reuse full English to avoid missing key noise; other langs can be added if specific tests need them.

let testI18n: I18nInstance | null = null

export function ensureTestI18n(){
  if(!testI18n){
    testI18n = i18n.createInstance()
    void testI18n.use(initReactI18next).init({
      resources: { en: { translation: en } },
      lng: 'en',
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    })
  }
  return testI18n!
}

export const I18nTestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inst = ensureTestI18n()
  return <I18nextProvider i18n={inst}>{children}</I18nextProvider>
}

export function withI18n(ui: React.ReactElement){
  return <I18nTestProvider>{ui}</I18nTestProvider>
}

export { testI18n as testI18nInstance }
