import React, { createContext, useContext, useState } from "react";
import { TRANSLATIONS } from "./constants";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("dari_lang") || "fr");

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem("dari_lang", l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.fr;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}