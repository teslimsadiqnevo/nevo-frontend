export type TeacherProfileIdentity = {
  fullName: string;
  email: string;
  subjects: string[];
  educationLevels: string[];
  avatarUrl: string;
  schoolId: string | null;
};

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

export function normalizeTeacherProfile(data: any): TeacherProfileIdentity {
  const payload = data?.teacher || data?.profile || data?.data || data || {};
  const fullName =
    String(
      payload.name ||
        payload.full_name ||
        payload.display_name ||
        `${payload.first_name || ""} ${payload.last_name || ""}`.trim(),
    ).trim() || "Teacher";

  const avatarUrl = String(
    payload.avatar_url ||
      payload.avatarUrl ||
      payload.profile_photo_url ||
      payload.profile_image_url ||
      payload.photo_url ||
      payload.image_url ||
      payload.avatar ||
      "",
  ).trim();

  const rawSchoolId =
    payload.school_id ?? payload.schoolId ?? payload.teaching_context?.school_id ?? null;
  const schoolId = rawSchoolId ? String(rawSchoolId).trim() || null : null;

  return {
    fullName,
    email: String(payload.email || "").trim(),
    subjects: toStringList(payload.subjects ?? payload.teaching_context?.subjects),
    educationLevels: toStringList(
      payload.education_levels ?? payload.educationLevels ?? payload.teaching_context?.education_levels,
    ),
    avatarUrl,
    schoolId,
  };
}
