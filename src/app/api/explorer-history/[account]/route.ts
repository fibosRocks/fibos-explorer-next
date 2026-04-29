import { NextRequest, NextResponse } from 'next/server'
import { environment } from '@/lib/config/environment'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const { account } = await params
    const { searchParams } = request.nextUrl
    const query = new URLSearchParams()
    if (searchParams.has('cursor')) query.set('cursor', searchParams.get('cursor')!)
    if (searchParams.has('limit')) query.set('limit', searchParams.get('limit')!)
    if (searchParams.has('page')) query.set('page', searchParams.get('page')!)
    if (searchParams.has('size')) query.set('size', searchParams.get('size')!)

    const isPaged = searchParams.has('page')
    const backendPath = isPaged
      ? `explorer/history/${account}/paged`
      : `explorer/history/${account}`
    const url = `${environment.filterUrl}/${backendPath}?${query}`
    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `Upstream error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
