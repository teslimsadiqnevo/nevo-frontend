"use client";

import { useSearchParams } from "next/navigation";
import { RegistrationConfirmation } from "@/features/TeacherRegistration";

export default function OnboardingVerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <RegistrationConfirmation email={email} nextPath="/register/teacher/workspace" />;
}

