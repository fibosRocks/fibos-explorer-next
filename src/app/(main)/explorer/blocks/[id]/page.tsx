import Link from 'next/link'
import { ArrowLeft, Box, Clock, Hash, Layers } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BlockPage({ params }: PageProps) {
  const { id } = await params

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
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Box className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">区块详情</h2>
            <p className="text-white/50 text-sm mt-1">Block Details</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="grid gap-6">
            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <Hash className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <p className="text-white/50 text-sm mb-1">区块号 / ID</p>
                <p className="text-white font-mono text-lg break-all">{id}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <Clock className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <p className="text-white/50 text-sm mb-1">状态</p>
                <p className="text-amber-400">功能开发中...</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-xl">
              <Layers className="w-5 h-5 text-purple-400 mt-1" />
              <div>
                <p className="text-white/50 text-sm mb-1">区块数据</p>
                <p className="text-white/70">即将显示完整的区块信息、交易列表等</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
