import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";
import { withAxiom, AxiomRequest } from "next-axiom";

export const GET = withAxiom(async (request: AxiomRequest) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  request.log.info("Auth callback triggered", { redirect_to });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      request.log.error("Failed to exchange code for session", { error });
    }
  }

  // URL to redirect to after sign-in process completes
  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
});