"use server";

import { signIn } from "@/features/Auth/api/auth";
import { AuthError } from "next-auth";

export async function loginStudent(data: {
  nevoId: string;
  pin: string;
}) {
  try {
    await signIn("credentials", {
      nevoId: data.nevoId,
      pin: data.pin,
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid credentials. Please try again." };
    }
    throw error;
  }
}
