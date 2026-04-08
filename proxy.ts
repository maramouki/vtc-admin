import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "vtc-admin-secret-change-in-prod"
);

const PUBLIC_PATHS = ["/login", "/api/auth", "/book", "/api/book"];
const SUPER_ADMIN_PATHS = ["/super-admin"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Routes super-admin : cookie séparé
  if (SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname === "/super-admin/login" || pathname.startsWith("/api/super-admin/auth")) {
      return NextResponse.next();
    }
    const superToken = req.cookies.get("vtc_super")?.value;
    if (!superToken) {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
    try {
      await jwtVerify(superToken, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/super-admin/login", req.url));
    }
  }

  const token = req.cookies.get("vtc_session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
