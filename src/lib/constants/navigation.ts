import {
  Send,
  Cpu,
  UserPlus,
  Vote,
  Home,
  Monitor,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

// Sidebar 导航配置（钱包/工具模块专用）
export const walletNavConfig: NavItem[] = [
  { label: '转账', href: '/wallet/transfer', icon: Send },
  { label: '资源管理', href: '/wallet/resources', icon: Cpu },
  { label: '创建账户', href: '/wallet/account/create', icon: UserPlus },
]

export const mobileNavConfig: NavItem[] = [
  { label: '首页', href: '/', icon: Home },
  { label: '投票', href: '/voting', icon: Vote },
  { label: '节点', href: '/nodes', icon: Monitor },
  { label: '工具', href: '/wallet/transfer', icon: Wrench },
]
