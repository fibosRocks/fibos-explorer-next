'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Vote, Monitor, Wrench, Wallet, Loader2, LogOut, ChevronDown } from 'lucide-react'
import { ThemeToggle } from '@/components/features/ThemeToggle'
import { NavbarSearch } from './NavbarSearch'
import { cn } from '@/lib/utils'
import { useWalletStore } from '@/stores/walletStore'

const navItems = [
  { label: '投票', href: '/voting', icon: Vote },
  { label: '节点', href: '/nodes', icon: Monitor },
  { label: '工具', href: '/wallet/transfer', icon: Wrench },
]

const languages = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

interface NavbarProps {
  showSearch?: boolean
  transparent?: boolean
  className?: string
}

export function Navbar({ showSearch = true, transparent = false, className }: NavbarProps) {
  const pathname = usePathname()
  const [currentLang, setCurrentLang] = useState('zh')
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 钱包状态
  const { connected, connecting, account, accountStatus, connect, disconnect, error } = useWalletStore()

  // 避免 SSR 水合问题
  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const currentLanguage = languages.find((l) => l.code === currentLang) ?? { code: 'zh', label: '中文', flag: '🇨🇳' }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-16',
        transparent
          ? 'bg-transparent'
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10',
        className
      )}
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 lg:px-8 flex items-center gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="FIBOS ROCKS"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            FIBOS ROCKS
          </span>
        </Link>

        {/* Main Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'text-purple-600 dark:text-cyan-400 bg-purple-500/10 dark:bg-cyan-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Center area - Search or Spacer */}
        <div className="flex-1 flex justify-center">
          {showSearch && (
            <div className="hidden lg:block w-full max-w-md">
              <NavbarSearch />
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile/Tablet Search Icon */}
          <NavbarSearch mode="icon" className="lg:hidden" />

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title={currentLanguage.label}
            >
              {currentLanguage.flag}
            </button>

            {showLangMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLangMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[120px]">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code)
                        setShowLangMenu(false)
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors',
                        currentLang === lang.code
                          ? 'bg-purple-500/10 text-purple-600 dark:text-cyan-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wallet Button */}
          {mounted && connected && account ? (
            <div className="relative">
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">{account.name}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showWalletMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowWalletMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[200px]">
                    {/* 账户信息 */}
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {account.name}
                      </div>
                      {accountStatus && (
                        <div className="text-xs text-slate-500 mt-1">
                          {accountStatus.balance}
                        </div>
                      )}
                    </div>

                    {/* 查看账户 */}
                    <Link
                      href={`/explorer/accounts/${account.name}`}
                      onClick={() => setShowWalletMenu(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Wallet className="w-4 h-4" />
                      查看账户
                    </Link>

                    {/* 断开连接 */}
                    <button
                      onClick={() => {
                        disconnect()
                        setShowWalletMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      断开连接
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => connect()}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">连接中...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">连接钱包</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {mounted && error && (
        <div className="absolute top-full left-0 right-0 bg-red-500 text-white text-sm text-center py-2">
          {error}
        </div>
      )}
    </header>
  )
}
