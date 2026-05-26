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

export type InternalPilotMetrics = {
  completion_rate: number;
  lessons_started: number;
  lessons_completed: number;
  avg_session_time: number;
  control_usage: {
    simplify: number;
    expand: number;
    slower: number;
    speed_up: number;
    tts: number;
  };
  pre_cache: {
    hit_rate: number;
    avg_cached_ms: number;
    avg_live_ms: number;
  };
  avg_upload_time?: number | null;
  avg_ease_score?: number | null;
  would_upload_again_pct?: number | null;
  checkpoint_accuracy?: number | null;
  concept_accuracy: Array<{
    concept_id: string;
    accuracy: number;
    attempts: number;
  }>;
  esl_breakdown: {
    esl_avg_score?: number | null;
    standard_avg_score?: number | null;
    esl_student_count: number;
  };
  feedback_prompt: {
    accepted: number;
    dismissed: number;
    ignored: number;
  };
};
