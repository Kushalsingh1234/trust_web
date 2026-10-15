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
    const saved = localStorage.getItem('rsssst_lang');
    return saved === 'en' ? 'en' : 'hi'; // default to Hindi for authentic Gorakhpur Sanatan Trust
  });

  useEffect(() => {
    localStorage.setItem('rsssst_lang', lang);
    document.documentElement.lang = lang;
    document.title = lang === 'hi'
      ? 'राष्ट्रीय सनातन संस्कार सेवा संस्थान (ट्रस्ट) | Gorakhpur'
      : 'Rashtriya Sanatan Sanskar Seva Sansthan (Trust) | Gorakhpur';
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
