import { NextRequest, NextResponse } from 'next/server';

/** Temporary gate for a private MVP. Replace with a real identity provider before wider use. */
export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next();
  const expectedUser = process.env.APP_ACCESS_USER || 'admin';
  const expectedPassword = process.env.APP_ACCESS_PASSWORD;
  if (!expectedPassword) {
    return new NextResponse('Private Scholarship Agent MVP is not configured. Set APP_ACCESS_PASSWORD in deployment environment variables.', { status: 503 });
  }
  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Basic ')) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(':');
      const user = decoded.slice(0, separator);
      const password = decoded.slice(separator + 1);
      if (separator >= 0 && user === expectedUser && password === expectedPassword) return NextResponse.next();
    } catch { /* Return the auth challenge for malformed credentials. */ }
  }
  return new NextResponse('Authentication required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Scholarship Agent Private MVP", charset="UTF-8"' } });
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
