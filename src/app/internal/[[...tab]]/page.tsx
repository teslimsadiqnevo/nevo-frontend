import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InternalOpsShell, type InternalOpsTab } from "@/features/InternalOps";

const INTERNAL_TOKEN_COOKIE = "internal_ops_token";
const INTERNAL_TABS: InternalOpsTab[] = ["live", "pilot", "product", "ai"];

export default async function InternalOpsPage({
  params,
}: {
  params: Promise<{ tab?: string[] }>;
}) {
  const cookieStore = await cookies();
  if (!cookieStore.get(INTERNAL_TOKEN_COOKIE)?.value) {
    redirect("/internal/login");
  }

  const { tab } = await params;
  const activeTab = tab?.[0] ?? "live";
  if (!INTERNAL_TABS.includes(activeTab as InternalOpsTab)) {
    redirect("/internal/live");
  }

  return <InternalOpsShell activeTab={activeTab as InternalOpsTab} />;
}
