import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import th from './locales/th.json'

const i18n = createI18n({
  legacy: false, // Use Composition API mode
  locale: 'en', // set locale
  fallbackLocale: 'en', // set fallback locale
  messages: {
    en,
    th
  }
})

export default i18n
