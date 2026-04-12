import { createClient } from "../../../../supabase/server";
import { NextResponse, NextRequest } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth:callback");

export const GET = async (request: NextRequest) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  log.info({ redirect_to }, "Auth callback triggered");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      log.error({ error: error.message }, "Failed to exchange code for session");
    } else {
      log.info("Session exchanged successfully");
    }
  } else {
    log.warn("Auth callback hit without an authorization code");
  }

  // URL to redirect to after sign-in process completes
  const redirectTo = redirect_to || "/dashboard";
  log.debug({ redirectTo }, "Redirecting after auth callback");
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
};