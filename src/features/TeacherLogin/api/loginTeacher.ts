"use server";

import { signIn } from "@/features/Auth/api/auth";
import { AuthError } from "next-auth";
import { getDashboardPath } from "@/shared/lib";

export async function loginTeacher(data: {
  email: string;
  password?: string;
  redirectTo?: string;
}) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      loginType: "teacher",
      redirectTo: data.redirectTo || getDashboardPath("teacher", "home"),
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials. Please try again." };
    }
    throw error;
  }
}
