"use server";

import { signIn } from "@/features/Auth/api/auth";
import { AuthError } from "next-auth";

export async function loginSchool(data: {
  email: string;
  password?: string;
}) {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
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
