import Link from 'next/link'
import { ArrowLeft, Key, User, Copy } from 'lucide-react'

interface PageProps {
  params: Promise<{ key: string }>
}

export default async function PublicKeyPage({ params }: PageProps) {
  const { key } = await params

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回首页</span>
          </Link>
          <h1 className="text-xl font-semibold text-white">FIBOS Explorer</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <Key className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">公钥查询</h2>
            <p className="text-white/50 text-sm mt-1">Public Key Lookup</p>
          </div>
        </div>

        {/* Key Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex items-start gap-4">
            <Key className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-white/50 text-sm mb-2">公钥</p>
              <div className="flex items-center gap-2">
                <p className="text-white font-mono text-sm break-all">{decodeURIComponent(key)}</p>
                <button
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0"
                  title="复制公钥"
                >
                  <Copy className="w-4 h-4 text-white/70" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Related Accounts */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">关联账户</span>
          </div>
          <p className="text-amber-400 text-sm">功能开发中...</p>
          <p className="text-white/50 text-sm mt-2">即将显示使用此公钥的所有账户列表</p>
        </div>
      </div>
    </main>
  )
}
