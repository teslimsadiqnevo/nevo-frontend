"use server";

import { signIn } from "@/features/Auth/api/auth";

export async function registerStudent(data: {
  firstName: string;
  lastName: string;
  age: string;
  pin: string;
}) {
  try {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      age: Number(data.age),
      pin: data.pin,
      role: "student",
      school_id: "b0f8b881-376d-445d-845c-a94f2e626c0d"
    };

    const res = await fetch(
      "https://api.nevolearning.com/api/v1/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = await res.json();

    if (!res.ok) {
      return { error: result.detail || "Failed to register student." };
    }



    return { success: true, data: result };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "An unexpected error occurred." };
  }
}
