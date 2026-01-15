/**
 * 格式化时间（CPU 资源）
 * 输入单位：微秒 (μs)
 */
export function formatTime(microseconds: number): string {
  if (microseconds > 3600000000) {
    return (microseconds / 3600000000).toFixed(2) + ' H'
  } else if (microseconds > 60000000) {
    return (microseconds / 60000000).toFixed(2) + ' M'
  } else if (microseconds > 1000000) {
    return (microseconds / 1000000).toFixed(2) + ' S'
  } else {
    return (microseconds / 1000).toFixed(2) + ' ms'
  }
}

/**
 * 格式化字节（NET/RAM 资源）
 * 输入单位：字节 (bytes)
 */
export function formatBytes(bytes: number): string {
  if (bytes > 1073741824) {
    return (bytes / 1073741824).toFixed(2) + ' GB'
  } else if (bytes > 1048576) {
    return (bytes / 1048576).toFixed(2) + ' MB'
  } else if (bytes > 1024) {
    return (bytes / 1024).toFixed(2) + ' KB'
  } else {
    return bytes.toFixed(2) + ' B'
  }
}

/**
 * 计算百分比
 */
export function formatPercent(used: number, max: number): string {
  if (used === 0 || max === 0) {
    return '0%'
  }
  return ((used / max) * 100).toFixed(2) + '%'
}

/**
 * 格式化余额
 * 例: "1234.5678 FO" -> "1,234.5678 FO"
 */
export function formatBalance(balance: string): string {
  const [amount, symbol] = balance.split(' ')
  if (!amount) return balance

  const [integer, decimal] = amount.split('.')
  const formattedInteger = integer!.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return decimal ? `${formattedInteger}.${decimal} ${symbol}` : `${formattedInteger} ${symbol}`
}

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 格式化相对时间
 * 例: "2 分钟前"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return `${seconds} 秒前`
}
