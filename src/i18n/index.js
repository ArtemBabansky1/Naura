import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { getLocaleFromPath } from '../lib/locale'

import enCommon from './locales/en/common.json'
import enHero from './locales/en/hero.json'
import enFeatures from './locales/en/features.json'
import enHowItWorks from './locales/en/howItWorks.json'
import enCommunities from './locales/en/communities.json'
import enTelegram from './locales/en/telegram.json'
import enAiAgents from './locales/en/aiAgents.json'
import enPricing from './locales/en/pricing.json'
import enFaq from './locales/en/faq.json'
import enCta from './locales/en/cta.json'
import enFooter from './locales/en/footer.json'
import enSupport from './locales/en/support.json'

import ruCommon from './locales/ru/common.json'
import ruHero from './locales/ru/hero.json'
import ruFeatures from './locales/ru/features.json'
import ruHowItWorks from './locales/ru/howItWorks.json'
import ruCommunities from './locales/ru/communities.json'
import ruTelegram from './locales/ru/telegram.json'
import ruAiAgents from './locales/ru/aiAgents.json'
import ruPricing from './locales/ru/pricing.json'
import ruFaq from './locales/ru/faq.json'
import ruCta from './locales/ru/cta.json'
import ruFooter from './locales/ru/footer.json'
import ruSupport from './locales/ru/support.json'

const languageDetector = new LanguageDetector()
languageDetector.addDetector({
  name: 'pathLang',
  lookup() {
    if (typeof window === 'undefined') return undefined
    return getLocaleFromPath(window.location.pathname)
  },
})

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, hero: enHero, features: enFeatures, howItWorks: enHowItWorks, communities: enCommunities, telegram: enTelegram, aiAgents: enAiAgents, pricing: enPricing, faq: enFaq, cta: enCta, footer: enFooter, support: enSupport },
      ru: { common: ruCommon, hero: ruHero, features: ruFeatures, howItWorks: ruHowItWorks, communities: ruCommunities, telegram: ruTelegram, aiAgents: ruAiAgents, pricing: ruPricing, faq: ruFaq, cta: ruCta, footer: ruFooter, support: ruSupport },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: { order: ['pathLang', 'localStorage', 'navigator'], caches: ['localStorage'] },
  })

export default i18n
