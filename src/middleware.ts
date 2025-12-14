import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Allow access to login and auth routes
        if (path.startsWith("/login") || path.startsWith("/api/auth")) {
            return NextResponse.next();
        }

        // Protect all dashboard routes
        if (path.startsWith("/dashboard")) {
            if (!token) {
                // Not authenticated - redirect to login
                return NextResponse.redirect(new URL("/login", req.url));
            }

            // Check if trying to access admin routes
            const isAdminRoute =
                path.includes("/admin") ||
                req.nextUrl.searchParams.get("role") === "admin" ||
                req.nextUrl.searchParams.get("view") === "panel";

            if (isAdminRoute && token.role !== "admin") {
                // Not an admin trying to access admin routes - redirect to employee dashboard
                return NextResponse.redirect(new URL("/dashboard", req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Allow access to login page without token
                if (req.nextUrl.pathname.startsWith("/login")) {
                    return true;
                }
                // Require token for protected routes
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/admin/:path*",
    ],
};
