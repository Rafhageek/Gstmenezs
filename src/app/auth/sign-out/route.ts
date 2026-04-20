import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  // Limpa todos os cookies de estado de sessão.
  response.cookies.delete("mnz_unlock_at");
  response.cookies.delete("mnz_2fa_pending");
  response.cookies.delete("mnz_2fa_tentativas");
  return response;
}
