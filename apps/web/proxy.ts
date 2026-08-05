import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/', '/login', '/forgot-password', '/reset-password', '/auth/confirm', '/auth/error', '/auth/success', '/auth/unauthorized'];

// Routes that require admin role
const adminRoutes = ['/admin', '/category', '/resource', '/dashboard'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('token')?.value;
  const userCookie = req.cookies.get('user')?.value;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // If no token exists, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if token is expired
  try {
    const payload = decodeJwtPayload(token);
    if (!payload || payload.exp * 1000 <= Date.now()) {
      // Token expired, clear cookies and redirect to login
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('token');
      response.cookies.delete('user');
      return response;
    }

    // For admin routes, check if user has admin role
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      let user = null;
      if (userCookie) {
        try {
          user = JSON.parse(userCookie);
        } catch (e) {
          // Invalid user cookie
          const response = NextResponse.redirect(new URL('/auth/unauthorized', req.url));
          response.cookies.delete('token');
          response.cookies.delete('user');
          return response;
        }
      }

      if (!user || user.user_type !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
      }
    }
  } catch (error) {
    // Invalid token, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    response.cookies.delete('user');
    return response;
  }

  return NextResponse.next();
}

function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    // Base64url decode per RFC 7515
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API server)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
