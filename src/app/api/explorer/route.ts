import { NextRequest, NextResponse } from 'next/server'
import { environment } from '@/lib/config/environment'

export const runtime = 'edge'

/**
 * Explorer REST API 代理
 * 解决客户端组件直接调用 API 端点的 CORS 问题
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
    }

    // 构建查询参数
    const params = new URLSearchParams()
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        params.append(key, value)
      }
    })

    const queryString = params.toString()
    const url = `${environment.apiUrl}${path}${queryString ? '?' + queryString : ''}`

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `API Error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const text = await response.text()
    if (!text) {
      return NextResponse.json(null)
    }

    try {
      const result = JSON.parse(text)
      return NextResponse.json(result)
    } catch {
      // 如果不是 JSON，直接返回文本或包装后的对象
      return NextResponse.json({ data: text })
    }
  } catch (error) {
    console.error('Explorer API proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
