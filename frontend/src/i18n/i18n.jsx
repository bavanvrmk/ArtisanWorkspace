import { createContext, useContext, useState, useCallback } from 'react';
import en from './translations/en';
import hi from './translations/hi';
import ta from './translations/ta';
import te from './translations/te';

const translations = { en, hi, ta, te };

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Aa' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'अ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'அ' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'అ' },
];

// BCP 47 voice tags for Web Speech API
export const SPEECH_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('artisan_lang') || 'en';
  });

  const setLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      localStorage.setItem('artisan_lang', langCode);
      // Update the HTML lang attribute for accessibility
      document.documentElement.lang = langCode;
    }
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations.en?.[key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, SUPPORTED_LANGUAGES, SPEECH_LANG_MAP }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
