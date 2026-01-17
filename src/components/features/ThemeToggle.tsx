'use client'

import { Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

export function ThemeToggle() {
  const { t } = useTranslation()
  const [isDark, setIsDark] = useState(false)

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)

    if (newIsDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? t('common.switchToLight') : t('common.switchToDark')}
      className="w-11 h-11 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-200"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-300" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  )
}
