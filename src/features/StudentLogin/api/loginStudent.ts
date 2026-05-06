"use server";

import { signIn } from "@/features/Auth/api/auth";
import { AuthError } from "next-auth";
import { getDashboardPath } from "@/shared/lib";

export async function loginStudent(data: {
  firstName: string;
  nevoId: string;
  pin: string;
}) {
  try {
    await signIn("credentials", {
      firstName: data.firstName,
      nevoId: data.nevoId,
      pin: data.pin,
      redirectTo: getDashboardPath("student", "home"),
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials. Please try again." };
    }
    throw error;
  }
}
