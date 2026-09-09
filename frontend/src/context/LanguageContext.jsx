import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('orca_lang') || 'en';
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    localStorage.setItem('orca_lang', language);
  }, [language]);

  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || fallback || key;
  };

  const speakText = (text, targetLang = language) => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported on this browser');
      return;
    }

    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = text
      .replace(/###/g, '')
      .replace(/####/g, '')
      .replace(/\*\*/g, '')
      .replace(/>/g, '')
      .replace(/[-•]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (targetLang === 'hi') utterance.lang = 'hi-IN';
    else if (targetLang === 'mr') utterance.lang = 'mr-IN';
    else if (targetLang === 'ta') utterance.lang = 'ta-IN';
    else if (targetLang === 'ml') utterance.lang = 'ml-IN';
    else if (targetLang === 'gu') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-IN';

    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speakText, stopSpeaking, isSpeaking }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
