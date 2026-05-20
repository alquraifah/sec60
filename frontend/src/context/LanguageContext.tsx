import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ar, en } from '../i18n/translations'

export type Lang = 'ar' | 'en'

const dicts: Record<Lang, Record<string, string>> = { ar, en }

interface LangCtx {
  lang: Lang
  isRTL: boolean
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LangCtx>({
  lang: 'ar', isRTL: true,
  setLang: () => {}, t: k => k,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar')

  const setLang = (l: Lang) => {
    setLangState(l)
    document.documentElement.dir  = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  useEffect(() => {
    document.documentElement.dir  = 'rtl'
    document.documentElement.lang = 'ar'
  }, [])

  const t = (key: string): string => dicts[lang][key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, isRTL: lang === 'ar', setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
