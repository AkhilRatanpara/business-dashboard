import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('gunatit_auth_pin');
  const roleCookie = request.cookies.get('gunatit_auth_role');

  const isAuthenticated = authCookie?.value === 'authenticated';
  const role = roleCookie?.value || (isAuthenticated ? 'editor' : 'viewer');

  // Allow static files, favicon, and login API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/pin') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // If in Viewer mode, restrict write-access pages
  if (isAuthenticated && role === 'viewer') {
    const restrictedPages = [
      '/items/new',
      '/items/manage',
      '/settings',
    ];

    const isEditPage = /^\/items\/[^/]+\/edit$/.test(pathname);

    if (restrictedPages.some((page) => pathname.startsWith(page)) || isEditPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/items';
      return NextResponse.redirect(url);
    }

    // Protect write API endpoints from Viewer mutations
    if (pathname.startsWith('/api/')) {
      const method = request.method.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Viewer mode has read-only access.' },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
