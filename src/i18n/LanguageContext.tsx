import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LanguageCode, LanguageMeta, SUPPORTED_LANGUAGES, TranslationDictionary } from './types';
import { TRANSLATIONS } from './translations';

const LANGUAGE_STORAGE_KEY = 'openstream_language';

export function detectBrowserLanguage(): LanguageCode {
  if (typeof window === 'undefined' || !navigator) return 'es';

  const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  const lower = browserLang.toLowerCase();

  if (lower.startsWith('en')) return 'en';
  return 'es'; // default project fallback
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  detectedLanguage: LanguageCode;
  isAutoDetected: boolean;
  supportedLanguages: LanguageMeta[];
  currentLanguageMeta: LanguageMeta;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const detectedLanguage = useMemo(() => detectBrowserLanguage(), []);
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved as LanguageCode;
      }
    } catch {
      // Ignore
    }
    return detectedLanguage;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      setIsAutoDetected(!saved);
    } catch {
      setIsAutoDetected(false);
    }
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    setIsAutoDetected(false);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Storage quota or private browsing
    }
  };

  const t = useMemo(() => {
    return TRANSLATIONS[language] || TRANSLATIONS.es;
  }, [language]);

  const currentLanguageMeta = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        detectedLanguage,
        isAutoDetected,
        supportedLanguages: SUPPORTED_LANGUAGES,
        currentLanguageMeta,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
