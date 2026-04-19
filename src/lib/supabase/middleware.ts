import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: não execute lógica entre createServerClient e supabase.auth.getUser().
  // Caso contrário a sessão pode ser perdida silenciosamente.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rotas protegidas: redireciona para /login se não autenticado.
  // Ajuste a lista conforme expandirmos as áreas privadas.
  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/recuperar-senha");

  // Portal do contador: acesso via token na URL, sem login.
  const isPortalRoute =
    path.startsWith("/portal") || path.startsWith("/api/portal");

  const isPublicRoute = path === "/";

  if (!user && !isAuthRoute && !isPublicRoute && !isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
