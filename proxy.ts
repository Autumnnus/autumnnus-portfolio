import { auth } from "@/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isAdminPath = pathname
    .split("/")
    .some((segment) => segment === "admin");
  const isOnApi = pathname.startsWith("/api");
  const isFile = pathname.includes(".");

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  if (isAdminPath) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/tr/login", req.nextUrl));
    }
    if (req.auth?.user?.email !== adminEmail) {
      return NextResponse.redirect(new URL("/tr", req.nextUrl));
    }
  }

  if (isOnApi || isFile) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next|.*\\..*).*)",
    "/",
    "/(tr|en|de|fr|es|it|pt|ru|ja|ko|ar|zh)/:path*",
  ],
};
