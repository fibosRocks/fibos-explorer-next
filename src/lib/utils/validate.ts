/**
 * 验证 FIBOS 账户名
 * 规则: 12 个字符，只能包含 a-z 和 1-5
 */
export function validateAccountName(name: string): {
  valid: boolean
  error?: string
} {
  if (!name || name.length === 0) {
    return { valid: false, error: 'AccountIsEmpty' }
  }

  if (!/^[a-z1-5]{12}$/.test(name)) {
    return { valid: false, error: 'WrongAccountFormat' }
  }

  return { valid: true }
}

/**
 * 验证公钥
 */
export function validatePublicKey(
  key: string,
  prefix = 'FO'
): {
  valid: boolean
  error?: string
} {
  if (!key || key.length === 0) {
    return { valid: false, error: 'PublicKeyIsEmpty' }
  }

  // 简单的格式验证
  const regex = new RegExp(`^${prefix}[A-Za-z0-9]{50,}$`)
  if (!regex.test(key)) {
    return { valid: false, error: 'WrongPublicKeyFormat' }
  }

  return { valid: true }
}

/**
 * 验证金额
 */
export function validateAmount(amount: string | number): {
  valid: boolean
  error?: string
} {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(num) || num <= 0) {
    return { valid: false, error: 'AmountIsEmpty' }
  }

  return { valid: true }
}

/**
 * 验证 CPU/NET 抵押
 */
export function validateStake(cpu: string | number, net: string | number): {
  valid: boolean
  error?: string
} {
  const cpuNum = typeof cpu === 'string' ? parseFloat(cpu) : cpu
  const netNum = typeof net === 'string' ? parseFloat(net) : net

  if ((isNaN(cpuNum) || cpuNum === 0) && (isNaN(netNum) || netNum === 0)) {
    return { valid: false, error: 'Cpu/NetBothEmpty' }
  }

  return { valid: true }
}
