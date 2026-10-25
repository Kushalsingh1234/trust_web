import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

const LanguageContext = createContext();

const translations = {
  en,
  hi
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rsssst_lang');
        if (saved === 'hi') return 'hi';
        if (saved === 'en') return 'en';
      } catch (e) {}
    }
    // Default to English so global search crawlers (Google, Bing) index English title & description
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('rsssst_lang', lang);
    } catch (e) {}
    document.documentElement.lang = lang;
    document.title = lang === 'hi'
      ? 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) | राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट)'
      : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) | Official Website';
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = translations[lang] || translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
