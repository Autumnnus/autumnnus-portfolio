import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isOnApi = req.nextUrl.pathname.startsWith("/api");
  // Check if it's a file request (like favicon, images, etc.)
  const isFile = req.nextUrl.pathname.includes(".");

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (isOnAdmin) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/tr/login", req.nextUrl)); // Redirect to login
    }
    if (req.auth?.user?.email !== adminEmail) {
      return NextResponse.redirect(new URL("/tr", req.nextUrl));
    }
    return NextResponse.next();
  }

  if (isOnApi || isFile) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  // Skip all paths that should not be internationalized
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/",
    "/(tr|en|de|fr|es|it|pt|ru|ja|ko|ar|zh)/:path*",
  ],
};
