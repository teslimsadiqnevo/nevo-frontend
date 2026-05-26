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

export type InternalLiveSession = {
  active: boolean;
  session_id?: string | null;
  school_name?: string | null;
  school_location?: string | null;
  class_name?: string | null;
  lesson_title?: string | null;
  started_at?: string | null;
  stats: {
    students_active: number;
    lessons_completed: number;
    mins_running: number;
  };
};

export type InternalLiveSignal = {
  type: string;
  description: string;
  timestamp: string;
  severity: "info" | "warning" | "error" | string;
  source: string;
  student_id_anon?: string | null;
  concept_id?: string | null;
  details?: Record<string, unknown>;
};
