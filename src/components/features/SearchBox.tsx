'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { parseSearchQuery } from '@/lib/utils/search'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface SearchBoxProps {
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBox({
  placeholder = '搜索区块、交易、账户或公钥',
  className = '',
  autoFocus = false,
}: SearchBoxProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const result = parseSearchQuery(trimmed)
    if (result.type !== 'invalid') {
      router.push(result.path)
      setQuery('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-9 pr-20 h-10"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!query.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
        >
          搜索
        </Button>
      </div>
    </form>
  )
}
