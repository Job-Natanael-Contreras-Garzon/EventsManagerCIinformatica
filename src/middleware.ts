import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "./modules/auth/utils/jwt";


/**
 * Middleware para proteger las rutas de administración (/admin).
 * Verifica que el token JWT almacenado en cookies sea válido.
 * Los coordinadores tienen acceso restringido a /admin/usuarios solo para ver su perfil.
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

  // Pasar el rol del usuario en los headers de la request para que los Server Components lo lean
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role ?? "ADMIN");
  requestHeaders.set("x-user-name", payload.name);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Matcher que intercepta la ruta raíz /admin y todas sus subrutas
  matcher: ["/admin", "/admin/:path*"],
};
