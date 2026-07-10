import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Defensive middleware — if Supabase is misconfigured or down, we let the
// request through (page-level checks in staff/layout.tsx and app/layout.tsx
// still gate the protected routes). This prevents one bad call from 500'ing
// the entire site (e.g. when NEXT_PUBLIC_* env vars are missing on a fresh
// Vercel deploy).
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isStaffRoute = path.startsWith('/staff');
  const isAppRoute = path.startsWith('/app');

  // Public routes (especially /login and PWA assets) must never depend on
  // Supabase availability. Login redirects itself after successful auth.
  if (!isStaffRoute && !isAppRoute) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[middleware] missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    return NextResponse.next({ request });
  }

  try {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user && (isStaffRoute || isAppRoute)) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }

    return response;
  } catch (e) {
    console.error('[middleware] error — passing through:', e instanceof Error ? e.message : String(e));
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: ['/app/:path*', '/staff/:path*'],
};
