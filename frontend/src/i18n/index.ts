import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import si from './si.json';
import ta from './ta.json';

const storedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('bg_language') : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    si: { translation: si },
    ta: { translation: ta },
  },
  lng: storedLanguage ?? 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'bg_language' && event.newValue) {
      i18n.changeLanguage(event.newValue);
    }
  });
}

export default i18n;