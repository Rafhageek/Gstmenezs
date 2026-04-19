import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - imagens no /public
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|icon|apple-icon|templates/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|map)$).*)",
  ],
};
