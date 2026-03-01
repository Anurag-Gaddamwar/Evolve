import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isLoggedIn = !!request.cookies.get('token')?.value;

    // Redirect to the dashboard page if the user is logged in and tries to access the login page
    if (isLoggedIn && (path === '/login' || path === '/signup')) {
        return NextResponse.redirect(new URL('/', request.nextUrl));
    }

    // Redirect to the login page for any non-public path if the user is not logged in
    if (!isLoggedIn && path !== '/login' && path !== '/signup') {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    // Allow access to login and signup pages regardless of login status
    if (path === '/login' || path === '/signup') {
        return null; // Continue to the requested page
    }

    // For all other paths, ensure the user is logged in
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.nextUrl));
    }

    return null; // Continue to the requested page if the user is logged in
}

export const config = {
    // Explicitly list all paths you want the middleware to apply to
    matcher: ['/', '/login', '/signup', '/verifyemail', '/analytics', '/bot', '/profile'],
};
