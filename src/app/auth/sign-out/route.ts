import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
  // Limpa o cookie de unlock biométrico para forçar nova verificação.
  response.cookies.delete("mnz_unlock_at");
  return response;
}
