import { NextResponse } from 'next/server'
import { environment } from '@/lib/config/environment'

export const runtime = 'edge'

/**
 * BP 状态 API 代理
 * 解决客户端组件直接调用外部 API 的 CORS 问题
 */
export async function GET() {
  try {
    const response = await fetch(environment.bpStatusUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: `BP Status API Error: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('BP Status proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', rows2: [] },
      { status: 500 }
    )
  }
}
