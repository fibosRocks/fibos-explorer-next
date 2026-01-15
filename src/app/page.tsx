import { SearchBoxCool } from '@/components/features/SearchBoxCool'
import { Navbar } from '@/components/layout/Navbar'

export default function HomePage() {
  return (
    <>
      <Navbar transparent showSearch={false} />
      <main className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300">

      {/* Animated background - Light */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/80 via-slate-100/50 to-slate-200/80" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/15 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Animated background - Dark */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-600/20" />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-500/30 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg space-y-10 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-slate-700 via-purple-700 to-cyan-700 dark:from-white dark:via-purple-200 dark:to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl">
            FIBOS
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-light tracking-widest uppercase">
            Blockchain Explorer
          </p>
        </div>

        <SearchBoxCool />

        <div className="flex justify-center gap-8 text-sm text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            实时同步
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            安全可靠
          </span>
        </div>
      </div>
      </main>
    </>
  )
}
