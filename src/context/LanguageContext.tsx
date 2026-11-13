import React, { createContext, useContext, useState } from 'react';
import { Language, translations, formatTaka, toBnNumber, formatDate, amountInWords } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
  formatTaka: (amount: number) => string;
  toBnNumber: (val: number | string | undefined | null) => string;
  formatDate: (dateStr: string) => string;
  amountInWords: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('school_erp_lang') as Language) || 'bn';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('school_erp_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[language] || translations.en;
    return (dict as any)[key] || (translations.en as any)[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatTaka: (amount: number) => formatTaka(amount, language),
        toBnNumber,
        formatDate: (dateStr: string) => formatDate(dateStr, language),
        amountInWords: (amount: number) => amountInWords(amount, language),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
