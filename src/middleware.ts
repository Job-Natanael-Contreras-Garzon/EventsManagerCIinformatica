import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./modules/auth/utils/jwt";


/**
 * Middleware para proteger las rutas de administración (/admin).
 * Verifica que el token JWT almacenado en cookies sea válido.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Si intenta acceder a /admin (raíz), redirigir directamente al dashboard
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Permitir libre acceso a la página de login si no tiene sesión activa
  if (pathname === "/admin/login") {
    if (token) {
      const payload = await verifyJWT(token);
      if (payload) {
        // Redirigir al dashboard si ya tiene sesión iniciada
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Proteger cualquier otra subruta de /admin
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    // Si el token es inválido o ha expirado, limpiar la cookie y redirigir al login
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Matcher que intercepta la ruta raíz /admin y todas sus subrutas
  matcher: ["/admin", "/admin/:path*"],
};
