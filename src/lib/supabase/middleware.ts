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

  const path = request.nextUrl.pathname;

  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/recuperar-senha");

  // Portal do contador: acesso via token na URL, sem login.
  const isPortalRoute =
    path.startsWith("/portal") || path.startsWith("/api/portal");

  const isPublicRoute = path === "/";

  // Rotas da etapa 2FA (acessíveis durante o fluxo pós-login)
  const is2faRoute =
    path === "/verificacao-2fa" ||
    path.startsWith("/api/") ||
    path === "/auth/sign-out";

  // Rotas que nunca disparam lock biométrico
  const isUnlockRoute =
    path === "/desbloquear" ||
    path === "/bem-vindo" ||
    path === "/verificacao-2fa" ||
    path.startsWith("/api/auth/passkey") ||
    path === "/auth/sign-out";

  // Não autenticado → redireciona pra login (exceto rotas públicas)
  if (!user && !isAuthRoute && !isPublicRoute && !isPortalRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticado mas com 2FA pendente → só pode ficar em /verificacao-2fa
  if (user) {
    const pending2fa =
      !!request.cookies.get("mnz_2fa_pending")?.value &&
      !request.cookies.get("mnz_unlock_at")?.value;

    if (pending2fa && !is2faRoute && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/verificacao-2fa";
      return NextResponse.redirect(url);
    }
  }

  // Lock biométrico: cookie "mnz_unlock_at" existe = desbloqueado.
  if (user && path.startsWith("/dashboard") && !isUnlockRoute) {
    const precisaDesbloquear = !request.cookies.get("mnz_unlock_at")?.value;
    if (precisaDesbloquear) {
      const url = request.nextUrl.clone();
      url.pathname = "/desbloquear";
      url.searchParams.set("next", path + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
