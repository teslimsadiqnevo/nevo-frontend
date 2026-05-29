import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InternalLogEntryForm } from "@/features/InternalOps";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";

export default async function InternalLogEntryPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value) {
    redirect("/internal/login");
  }

  return <InternalLogEntryForm />;
}
