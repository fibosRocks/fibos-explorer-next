'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import zhMessages from './zh.json'
import enMessages from './en.json'

export type Locale = 'zh' | 'en'

type Messages = typeof zhMessages

const messages: Record<Locale, Messages> = {
  zh: zhMessages,
  en: enMessages,
}

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const STORAGE_KEY = 'fibos-explorer-locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh')
  const [mounted, setMounted] = useState(false)

  // 初始化时从 localStorage 读取
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && (saved === 'zh' || saved === 'en')) {
      setLocaleState(saved)
    } else {
      // 根据浏览器语言自动设置
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith('en')) {
        setLocaleState('en')
      }
    }
    setMounted(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(STORAGE_KEY, newLocale)
  }, [])

  // 获取翻译文本
  const t = useCallback((key: string): string => {
    const keys = key.split('.')
    let value: unknown = messages[locale]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        // 回退到中文
        let fallback: unknown = messages['zh']
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = (fallback as Record<string, unknown>)[fk]
          } else {
            return key // 都找不到则返回 key
          }
        }
        return typeof fallback === 'string' ? fallback : key
      }
    }

    return typeof value === 'string' ? value : key
  }, [locale])

  // 避免 hydration 不匹配
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: 'zh', setLocale, t }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

export function useLocale() {
  const { locale, setLocale } = useI18n()
  return { locale, setLocale }
}

export function useTranslation() {
  const { t } = useI18n()
  return { t }
}
