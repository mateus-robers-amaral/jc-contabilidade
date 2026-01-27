import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
);

const COOKIE_NAME = "jc-auth-token";

const publicPaths = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Helper function to handle unauthorized requests
  const handleUnauthorized = (deleteToken = false) => {
    // For API routes, return JSON error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Nao autorizado" },
        { status: 401 }
      );
    }
    // For page routes, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (deleteToken) {
      response.cookies.delete(COOKIE_NAME);
    }
    return response;
  };

  if (!token) {
    return handleUnauthorized();
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid token
    return handleUnauthorized(true);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth routes (for login/logout)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
