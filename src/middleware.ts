import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isExcludedPath = 
    pathname === '/waitlist' || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.includes('.');

  if (!isExcludedPath) {
    return NextResponse.redirect(new URL('/waitlist', request.url))
  }
}
 
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
