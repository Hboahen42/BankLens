"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth");

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    log.warn("Sign-up attempted without email or password");
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  log.info({ email }, "Sign-up initiated");

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: fullName,
        email: email,
      }
    },
  });

  if (error) {
    log.error({ email, error: error.message }, "Sign-up failed");
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    log.info({ userId: user.id, email }, "User created, inserting profile");
    try {
      const { error: updateError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: fullName,
          full_name: fullName,
          email: email,
          user_id: user.id,
          token_identifier: user.id,
          created_at: new Date().toISOString()
        });

      if (updateError) {
        log.error({ userId: user.id, error: updateError.message }, "Failed to insert user profile");
      }
    } catch (err) {
      log.error({ userId: user.id, err }, "Exception inserting user profile");
    }
  }

  log.info({ email }, "Sign-up completed, verification email sent");
  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  log.info({ email }, "Sign-in attempt");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    log.warn({ email, error: error.message }, "Sign-in failed");
    return encodedRedirect("error", "/sign-in", error.message);
  }

  log.info({ email }, "Sign-in successful");
  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    log.warn("Forgot-password submitted without email");
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  log.info({ email }, "Password reset requested");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    log.error({ email, error: error.message }, "Password reset email failed");
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  log.info({ email }, "Password reset email sent");

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    log.warn("Password reset submitted with missing fields");
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    log.warn("Password reset failed: passwords do not match");
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    log.error({ error: error.message }, "Password update failed");
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  log.info("Password updated successfully");
  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  log.info("User signing out");
  await supabase.auth.signOut();
  return redirect("/sign-in");
};