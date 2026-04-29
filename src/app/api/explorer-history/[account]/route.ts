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

    const url = `${environment.filterUrl}/explorer/history/${account}?${query}`
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
