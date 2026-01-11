import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from './lib/jwt';

// Define route configurations
const publicRoutes = [
  '/login',
  '/signup',
  '/adminlogin',
  '/userlogin'
];

const userRoutes = [
  '/user/Creditbill',
  '/user/generatebill',
  '/user/customerbillingdashboard',
  '/user/dashboardcardcustomer',
  '/user/printablebill',
  '/user/creditpage',
  '/user/dailysales',
  '/user/customers',
  '/user/credithistory',
  '/company/creditpage',
];

const adminRoutes = [
  '/admin/retaildashboard',
  '/admin/editdata',
  '/admin/consolidateddashboard',
  '/admin/CreditCustomerReport',
  '/admin/dashboard',
  '/admin/getdata',
  '/admin/postdata',
  '/admin/totalamount'
];

// Helper functions
const isValidTokenFormat = (token) => {
  return token && typeof token === 'string' && token.split('.').length === 3;
};

const createRedirectResponse = (path, request) => {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 302,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookieStore = await cookies();

  // Create base response with enhanced CORS and cache control
  const response = NextResponse.next();
  
  // Security Headers
  response.headers.set("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  
  // Cache Control Headers
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: response.headers });
  }

  // Get authentication tokens
  const userToken = cookieStore.get('token')?.value || '';
  const adminToken = cookieStore.get('admintoken')?.value || '';

  // Public routes logic with enhanced redirection
  if (publicRoutes.includes(pathname)) {
    if (userToken && isValidTokenFormat(userToken)) {
      try {
        const userData = await verifyToken(userToken);
        if (userData && userData.role === 'user') {
          return createRedirectResponse('/user/admin/totalamount', request);
        }
      } catch (error) {
        console.error('Token verification failed on public route:', error);
      }
    }
    
    if (adminToken && isValidTokenFormat(adminToken)) {
      try {
        const adminData = await verifyToken(adminToken);
        if (adminData && adminData.role === 'admin') {
          return createRedirectResponse('/admin/consolidateddashboard', request);
        }
      } catch (error) {
        console.error('Admin token verification failed on public route:', error);
      }
    }
    
    return response;
  }

  // Admin routes logic with enhanced security
  if (adminRoutes.includes(pathname) || pathname.startsWith('/admin')) {
    if (!adminToken || !isValidTokenFormat(adminToken)) {
      console.warn('Invalid or missing admin token format:', { pathname });
      return createRedirectResponse('/adminlogin', request);
    }

    try {
      const adminData = await verifyToken(adminToken);
      if (!adminData || adminData.role !== 'admin') {
        console.error('Invalid admin role or token data:', { adminData, pathname });
        return createRedirectResponse('/adminlogin', request);
      }
      return response;
    } catch (error) {
      console.error('Admin token verification failed:', {
        error: error.message,
        path: pathname,
        timestamp: new Date().toISOString()
      });
      return createRedirectResponse('/adminlogin', request);
    }
  }

  // User routes logic with enhanced security
  if (userRoutes.includes(pathname) || pathname.startsWith('/user')) {
    if (!userToken || !isValidTokenFormat(userToken)) {
      console.warn('Invalid or missing user token format:', { pathname });
      return createRedirectResponse('/userlogin', request);
    }

    try {
      const userData = await verifyToken(userToken);
      if (!userData || userData.role !== 'user') {
        console.error('Invalid user role or token data:', { userData, pathname });
        return createRedirectResponse('/userlogin', request);
      }
      return response;
    } catch (error) {
      console.error('User token verification failed:', {
        error: error.message,
        path: pathname,
        timestamp: new Date().toISOString()
      });
      return createRedirectResponse('/userlogin', request);
    }
  }

  // Default: allow access to unprotected routes
  return response;
}

// Enhanced matcher configuration
export const config = {
  matcher: [
    // Exclude static files and public assets
    '/((?!api|_next/static|_next/image|assets|favicon.ico).*)',
    
    // Include specific routes
    '/api/:path*',
    '/admin/:path*',
    '/user/:path*',
    '/company/:path*',
    '/userlogin',
    '/signup',
    '/adminlogin'
  ]
};