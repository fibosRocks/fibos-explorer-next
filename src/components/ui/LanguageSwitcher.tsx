'use client'

import { useLocale, type Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'

const localeLabels: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  const toggleLocale = () => {
    setLocale(locale === 'zh' ? 'en' : 'zh')
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
      title="Switch Language"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{localeLabels[locale]}</span>
    </button>
  )
}
