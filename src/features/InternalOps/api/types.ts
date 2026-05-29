export type InternalOpsTab =
  | "live"
  | "pilot"
  | "product"
  | "ai"
  | "schools"
  | "classes"
  | "teachers"
  | "students"
  | "lessons"
  | "support";

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

export type InternalPilotSchool = {
  school_id: string;
  school_name: string;
  location?: string | null;
  active_students: number;
  class_count: number;
};

export type InternalObservationLog = {
  id: string;
  log_date: string;
  school_id?: string | null;
  class_id?: string | null;
  school_name: string;
  location?: string | null;
  class_name: string;
  subject?: string | null;
  teacher_name?: string | null;
  students_present: number;
  lessons_started: number;
  lessons_completed: number;
  average_session_time_minutes?: number | null;
  engagement_level?: number | null;
  notable_moments?: string | null;
  simplify_used: number;
  expand_used: number;
  slower_used: number;
  tts_activated: number;
  esl_simplify_language_access: number;
  pre_cache_performance?: string | null;
  submitted_at: string;
};

export type InternalProductStats = {
  active_schools: number;
  active_students: number;
  sessions_today: number;
  lessons_published: number;
  session_activity_7d: Array<{
    label: string;
    date: string;
    count: number;
  }>;
};

export type InternalProductSchool = {
  school_id: string;
  school_name: string;
  location?: string | null;
  active_students: number;
  teacher_count: number;
  class_count: number;
  last_session_date?: string | null;
  completion_rate: number;
  status: string;
};

export type InternalProductError = {
  type: string;
  timestamp: string;
  details?: string | null;
  severity: string;
};

export type InternalConnectivityEvent = {
  timestamp: string;
  duration_seconds: number;
  sessions_affected: number;
  details?: string | null;
};

export type InternalAiHealth = {
  gemini: "ok" | "degraded" | "down" | string;
  fallback: "ok" | "degraded" | "down" | string;
  cache: "ok" | "degraded" | "down" | string;
};

export type InternalAiStats = {
  avg_transform_time: number;
  batch_success_rate: number;
  failed_transformations: number;
  response_times: Record<
    "simplify" | "expand" | "slower" | "speed_up",
    { avg_seconds: number; last_10: number[] }
  >;
};

export type InternalAiCache = {
  cache_hit_rate: number;
  avg_cached_response_ms: number;
  avg_live_response_ms: number;
  coverage: {
    simplify_pct: number;
    expand_pct: number;
    slower_pct: number;
  };
};

export type InternalAiEsl = {
  esl_student_count: number;
  esl_pct_of_total: number;
  esl_avg_comprehension_score?: number | null;
  standard_avg_comprehension_score?: number | null;
};

export type InternalAiImages = {
  image_fetch_success_rate: number;
  avg_fetch_time: number;
  cache_hit_rate: number;
};

export type InternalAiCost = {
  cost_today_ngn: number;
  cost_today_usd: number;
  breakdown: Record<string, number>;
  cost_week: number;
  cost_month: number;
};

export type InternalAiError = {
  type: string;
  timestamp: string;
  details?: string | null;
  severity: string;
};

export type InternalAdminPerson = {
  id: string;
  name: string;
  email?: string | null;
  is_active: boolean;
};

export type InternalAdminClassSummary = {
  class_id: string;
  class_name: string;
  school_id: string;
  school_name: string;
  teacher_id?: string | null;
  teacher_name?: string | null;
  student_count: number;
  assigned_lessons: number;
  completed_sessions: number;
  is_active: boolean;
  relationship_status: string;
};

export type InternalAdminClassDetail = InternalAdminClassSummary & {
  class_code?: string | null;
  education_level?: string | null;
  subjects: string[];
  academic_year_term?: string | null;
  students: InternalAdminPerson[];
  teacher_options: InternalAdminPerson[];
};

export type InternalAdminSchoolSummary = {
  school_id: string;
  school_name: string;
  location?: string | null;
  email?: string | null;
  phone_number?: string | null;
  school_type?: string | null;
  active_students: number;
  teacher_count: number;
  class_count: number;
  lesson_count: number;
  last_session_date?: string | null;
  is_active: boolean;
  relationship_status: string;
};

export type InternalAdminSchoolDetail = InternalAdminSchoolSummary & {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  website?: string | null;
  subscription_tier?: string | null;
  max_teachers: number;
  max_students: number;
  messaging_enabled: boolean;
  offline_access_enabled: boolean;
  classes: InternalAdminClassSummary[];
  teachers: InternalAdminPerson[];
};

export type InternalAdminTeacherSummary = {
  teacher_id: string;
  teacher_name: string;
  email?: string | null;
  school_id?: string | null;
  school_name?: string | null;
  assigned_classes: number;
  uploaded_lessons: number;
  active_assignments: number;
  completed_sessions: number;
  last_login_at?: string | null;
  is_active: boolean;
  relationship_status: string;
};

export type InternalAdminTeacherDetail = InternalAdminTeacherSummary & {
  phone_number?: string | null;
  subjects: string[];
  education_levels: string[];
  classes: InternalAdminClassSummary[];
  lessons: Array<Record<string, unknown>>;
};

export type InternalAdminStudentSummary = {
  student_id: string;
  student_name: string;
  nevo_id?: string | null;
  school_id?: string | null;
  school_name?: string | null;
  class_id?: string | null;
  class_name?: string | null;
  learning_preference?: string | null;
  is_esl_learner: boolean;
  lessons_completed: number;
  assigned_lessons: number;
  completed_sessions: number;
  last_activity_at?: string | null;
  is_active: boolean;
  relationship_status: string;
};

export type InternalAdminStudentDetail = InternalAdminStudentSummary & {
  email?: string | null;
  age?: number | null;
  adapt_automatically: boolean;
  voice_guidance: boolean;
  large_text: boolean;
  extra_spacing: boolean;
  average_score: number;
  total_time_spent_seconds: number;
  current_streak_days: number;
  reading_level?: string | null;
  complexity_tolerance?: string | null;
  class_options: InternalAdminClassSummary[];
  recent_lessons: Array<Record<string, unknown>>;
};

export type InternalAdminLessonSummary = {
  lesson_id: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  status: string;
  school_id?: string | null;
  school_name?: string | null;
  teacher_id: string;
  teacher_name?: string | null;
  concept_count: number;
  assignment_count: number;
  completed_assignments: number;
  sessions_count: number;
  adapted_variants: number;
  failed_jobs: number;
  latest_job_status?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  relationship_status: string;
};

export type InternalAdminLessonDetail = InternalAdminLessonSummary & {
  description?: string | null;
  target_grade_level: number;
  estimated_duration_minutes: number;
  objectives: string[];
  key_concepts: string[];
  simplify_enabled: boolean;
  expand_enabled: boolean;
  max_difficulty: number;
  processed_at?: string | null;
  jobs: Array<Record<string, unknown>>;
  assignments: Array<Record<string, unknown>>;
  variants: Array<Record<string, unknown>>;
};
