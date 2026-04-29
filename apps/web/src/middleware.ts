export { default } from 'next-auth/middleware';

// Protect every route except the login page, NextAuth callbacks, and Next.js
// static assets. The middleware redirects unauthenticated requests to /login.
export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
