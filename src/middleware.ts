// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que no necesitan autenticación
const PUBLIC_PATHS = ['/login', '/signup', '/reset-password'];
// Rutas que necesitan autenticación pero no perfil completo
const UNRESTRICTED_PATHS = ['/profile'];
// Ruta especial de logout
const LOGOUT_PATH = '/logout';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar si hay sesión
  const session = request.cookies.get('session')?.value;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Permitir acceso a /profile y /logout si hay sesión
  if (UNRESTRICTED_PATHS.includes(pathname) || pathname === LOGOUT_PATH) {
    return NextResponse.next();
  }

  // Para todas las demás rutas, permitir acceso ya que el perfil
  // se verificará en el componente
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/profile',
    '/login',
    '/signup',
    '/reset-password',
    '/logout'
  ]
};
