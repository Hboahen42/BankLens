"use server";

import {encodedRedirect, getURL} from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("auth");

const maskEmail = (email?: string | null) => {
  if (!email) return undefined;

  const atIndex = email.indexOf("@");
  if (atIndex <= 1) {
    return `${email.slice(0, 1)}*****`;
  }
  return `${email.slice(0, 1)}*****${email.slice(atIndex)}`;
};

const toSafeErrorMeta = (error: unknown) => {
  if (!error || typeof error !== "object") return undefined;
  const e = error as { name?: string; code?: string | number; status?: number };
  return {
    name: e.name,
    code: e.code,
    status: e.status,
  }
}
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

  log.info({ email: maskEmail(email) }, "Sign-up initiated");

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
    log.error({ email: maskEmail(email), error: toSafeErrorMeta(error) }, "Sign-up failed");
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    log.info({ userId: user.id, email: maskEmail(email) }, "User created, inserting profile");
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
        log.error({ userId: user.id, error: toSafeErrorMeta(error) }, "Failed to insert user profile");
        return encodedRedirect(
            "error",
            "/sign-up",
            "Account created, but we could not finish setting up your profile. Please try again."
        );
      }
    } catch (err) {
      log.error({ userId: user.id, err }, "Exception inserting user profile");
      return encodedRedirect(
          "error",
          "/sign-up",
          "Account created, but we could not finish setting up your profile. Please try again."
      );
    }
  }

  log.info({ email: maskEmail(email) }, "Sign-up completed, verification email sent");
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

  log.info({ email: maskEmail(email) }, "Sign-in attempt");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    log.error({ email: maskEmail(email), error: toSafeErrorMeta(error) }, "Sign-in failed");
    return encodedRedirect("error", "/sign-in", error.message);
  }

  log.info({ email: maskEmail(email) }, "Sign-in successful");
  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = getURL();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    log.warn("Forgot-password submitted without email");
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  log.info({ email: maskEmail(email) }, "Password reset requested");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/dashboard/reset-password`,
  });

  if (error) {
    log.error({ email: maskEmail(email) , error: toSafeErrorMeta(error) }, "Password reset email failed");
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  log.info({ email: maskEmail(email) }, "Password reset email sent");

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
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    log.warn("Password reset failed: passwords do not match");
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    log.error({ error: toSafeErrorMeta(error) }, "Password update failed");
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  log.info("Password updated successfully");
  return encodedRedirect("success", "/sign-in", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  log.info("User signing out");
  await supabase.auth.signOut();
  return redirect("/sign-in");
};