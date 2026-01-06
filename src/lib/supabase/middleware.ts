import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Auth routes (login/signup)
  const isAuthRoute = pathname === '/login' || pathname === '/signup'

  // Demo brand ID for public access
  const DEMO_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'
  
  // Public routes - no authentication required
  const isPublicRoute = pathname === '/' || 
    pathname === '/demo' || 
    pathname.startsWith('/demo/') ||
    pathname.startsWith(`/${DEMO_BRAND_ID}`)

  // Protected routes - require authentication
  const protectedPrefixes = ['/briefing', '/brand']
  const isProtectedRoute = !isPublicRoute && (
    protectedPrefixes.some(prefix => pathname.startsWith(prefix)) ||
    /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(pathname)
  )

  // Redirect unauthenticated users from protected routes to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from auth routes
  // Check if user has brands and redirect accordingly
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    
    // Check for redirect param first
    const redirectTo = request.nextUrl.searchParams.get('redirect')
    if (redirectTo) {
      url.pathname = redirectTo
      url.searchParams.delete('redirect')
      return NextResponse.redirect(url)
    }
    
    // Try to get user's first brand
    const { data: brands } = await supabase
      .from('brands')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
    
    if (brands && brands.length > 0) {
      // User has brands - redirect to their first brand's dashboard
      url.pathname = `/${brands[0].id}`
    } else {
      // No brands - redirect to briefing to create one
      url.pathname = '/briefing'
    }
    
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
