import {
  Send,
  Cpu,
  UserPlus,
  Vote,
  Home,
  Monitor,
  Wrench,
  Code,
  Shield,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  labelKey: string
  href: string
  icon: LucideIcon
}

// Sidebar 导航配置（钱包/工具模块专用）
export const walletNavConfig: NavItem[] = [
  { labelKey: 'nav.transfer', href: '/wallet/transfer', icon: Send },
  { labelKey: 'nav.resources', href: '/wallet/resources', icon: Cpu },
  { labelKey: 'nav.createAccount', href: '/wallet/account/create', icon: UserPlus },
  { labelKey: 'nav.contract', href: '/wallet/contract', icon: Code },
  { labelKey: 'nav.multisig', href: '/wallet/multisig', icon: Shield },
]

export const mobileNavConfig: NavItem[] = [
  { labelKey: 'common.home', href: '/', icon: Home },
  { labelKey: 'nav.voting', href: '/voting', icon: Vote },
  { labelKey: 'nav.nodes', href: '/nodes', icon: Monitor },
  { labelKey: 'nav.wallet', href: '/wallet/transfer', icon: Wrench },
]
