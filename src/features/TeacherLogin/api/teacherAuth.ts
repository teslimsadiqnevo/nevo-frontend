"use server";

import { apiFetch } from "@/shared/lib/api";

async function parse(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data as any)?.detail;
    const error = typeof detail === "string" ? detail : fallback;
    return { error };
  }
  return { data };
}

export async function resendTeacherVerification(email: string) {
  const res = await apiFetch("/auth/teacher/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return parse(res, "Could not resend verification email.");
}

export async function forgotTeacherPassword(email: string) {
  const res = await apiFetch("/auth/teacher/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return parse(res, "Could not send reset link.");
}

export async function resetTeacherPassword(token: string, newPassword: string) {
  const res = await apiFetch("/auth/teacher/reset-password", {
    method: "POST",
    body: JSON.stringify({ reset_token: token, new_password: newPassword }),
  });
  return parse(res, "Could not reset password.");
}

export async function forgotSchoolPassword(email: string) {
  const res = await apiFetch("/auth/school/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return parse(res, "Could not send reset link.");
}

export async function resetSchoolPassword(token: string, newPassword: string) {
  const res = await apiFetch("/auth/school/reset-password", {
    method: "POST",
    body: JSON.stringify({ reset_token: token, new_password: newPassword }),
  });
  return parse(res, "Could not reset password.");
}
