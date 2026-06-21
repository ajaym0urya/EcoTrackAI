import { NextResponse } from "next/server";

export function middleware() {
  const response = NextResponse.next();

  // 1. Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' http://127.0.0.1:8000 http://localhost:8000;
  `.replace(/\s{2,}/g, " ").trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // 3. Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // HSTS (Strict-Transport-Security)
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // 4. Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 5. Cross-Site Scripting (XSS) Filter protection for older browsers
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // 6. Restrict client permissions
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

export const config = {
  // Apply headers to all paths except static files and assets
  matcher: "/((?!api|_next/static|_next/image|favicon.ico).*)",
};
