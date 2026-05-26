export type InternalOpsTab = "live" | "pilot" | "product" | "ai";

export type InternalOpsUser = {
  email: string;
  name: string;
  role: string;
};

export type InternalHealth = {
  api?: "ok" | "degraded" | "down" | string;
  db?: "ok" | "degraded" | "down" | string;
  ai?: "ok" | "degraded" | "down" | string;
  cache?: "ok" | "degraded" | "down" | string;
  environment?: string;
  internal_dashboard?: string;
  planned_screens?: string[];
};
