import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    status: 'UP',
    service: 'bikeoasis-web',
    checkedAt: new Date().toISOString(),
  })
}
