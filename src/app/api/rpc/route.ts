import { NextRequest, NextResponse } from 'next/server'
import { environment } from '@/lib/config/environment'

export const runtime = 'edge'

/**
 * RPC 代理 API
 * 解决客户端组件直接调用 RPC 端点的 CORS 问题
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, data } = body

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    const response = await fetch(`${environment.blockchainUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `RPC Error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('RPC proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
