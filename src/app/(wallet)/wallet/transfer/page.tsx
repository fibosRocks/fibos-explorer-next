import { Send, Wallet, ChevronDown, Info } from 'lucide-react'

/**
 * 转账页面
 *
 * 数据来源 (参考老项目 tools/transfer/transfer.component.ts):
 * - ironman.getAccountName() - 当前账户名
 * - ironman.getStatus() - 账户状态 (余额等)
 * - eosService.eos.getCurrencyBalance(contract, account, symbol) - 代币余额
 * - eosService.eos.getAccount(name) - 检查收款账户是否存在
 *
 * FIBOS 链特殊处理:
 * - eosService.eos.getTableRows("eosio.token", account, "accounts") -> 获取代币列表
 *
 * 转账操作:
 * - eosio.token::transfer (EOS/FO)
 * - eosio.token::extransfer (其他代币, FIBOS特有)
 */

export default function TransferPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">转账</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">向其他账户发送代币</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-6">
            {/* From Account - 来自 ironman.getAccountName() */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                从账户
              </label>
              <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <div className="text-slate-400 text-sm">未连接钱包</div>
                </div>
              </div>
            </div>

            {/* To Account - 通过 getAccount() 验证是否存在 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                收款账户
              </label>
              <input
                type="text"
                placeholder="输入 FIBOS 账户名"
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
              <p className="text-xs text-slate-400 mt-2">账户名为 12 位小写字母和数字 1-5 的组合</p>
            </div>

            {/* Amount - 余额来自 getCurrencyBalance() */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                转账金额
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="0.0000"
                    className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-purple-600 dark:text-cyan-400 font-medium hover:underline">
                    全部
                  </button>
                </div>
                {/* Token Select - 来自 environment.tokens 或 accounts 表 */}
                <button className="h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <span className="font-medium text-slate-900 dark:text-white">FO</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>可用余额</span>
                <span>0.0000 FO</span>
              </div>
            </div>

            {/* Memo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                备注 <span className="text-slate-400 font-normal">(可选)</span>
              </label>
              <input
                type="text"
                placeholder="输入转账备注"
                className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <button className="w-full h-12 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              确认转账
            </button>
          </div>
        </div>

        {/* Right Side - Balance Info */}
        <div className="space-y-6">
          {/* Balance Card - 来自 ironman.getStatus().balance */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">可用余额</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">0.0000 FO</div>
          </div>

          {/* Info Box */}
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 p-5">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <p className="mb-2">转账说明：</p>
                <ul className="text-slate-400 space-y-1">
                  <li>• 转账需要消耗 CPU 和 NET 资源</li>
                  <li>• 请确认收款账户名正确</li>
                  <li>• 转账后不可撤销</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
