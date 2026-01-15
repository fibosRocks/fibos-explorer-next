import { describe, it, expect } from 'bun:test'
import { parseSearchQuery } from '@/lib/utils/search'

describe('parseSearchQuery', () => {
  it('should parse 12-digit number as account', () => {
    const result = parseSearchQuery('123456789012')
    expect(result.type).toBe('account')
    expect(result.path).toBe('/explorer/accounts/123456789012')
  })

  it('should parse other digit number as block', () => {
    const result = parseSearchQuery('429133596')
    expect(result.type).toBe('block')
    expect(result.path).toBe('/explorer/blocks/429133596')
  })

  it('should parse FO-prefixed string as public key', () => {
    const result = parseSearchQuery('FO6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV')
    expect(result.type).toBe('publickey')
    expect(result.path).toContain('/explorer/publickey/FO')
  })

  it('should parse 64-char hex as transaction', () => {
    const result = parseSearchQuery('a'.repeat(64))
    expect(result.type).toBe('transaction')
    expect(result.path).toContain('/explorer/transactions/')
  })

  it('should parse account name as account', () => {
    const result = parseSearchQuery('fiboscouncil')
    expect(result.type).toBe('account')
    expect(result.path).toBe('/explorer/accounts/fiboscouncil')
  })

  it('should handle empty query', () => {
    const result = parseSearchQuery('')
    expect(result.type).toBe('invalid')
  })
})
