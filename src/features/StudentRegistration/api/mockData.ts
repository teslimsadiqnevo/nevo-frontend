import { apiFetch } from "@/shared/lib/api";

export type SchoolSearchOption = {
  id: string;
  name: string;
  location: string;
};

export type SchoolClassOption = {
  id: string;
  name: string;
  teacher: string;
};

function buildErrorMessage(data: any, fallback: string) {
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.error === "string") return data.error;
  return fallback;
}

export async function fetchSchools(query: string = "") {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  try {
    const res = await apiFetch(
      `/schools/search?q=${encodeURIComponent(trimmedQuery)}`,
    );

    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      throw new Error(buildErrorMessage(data, "Failed to fetch schools."));
    }

    const data = await res.json();
    const schools = Array.isArray(data) ? data : data.schools || [];

    return schools.map((s: any): SchoolSearchOption => ({
      id: s.id || s.school_id,
      name: s.name || s.school_name,
      location:
        s.location ||
        [s.city, s.state].filter(Boolean).join(", ") ||
        s.state ||
        "",
    }));
  } catch (err) {
    console.error("Error fetching schools:", err);
    throw err instanceof Error ? err : new Error("Failed to fetch schools.");
  }
}

export async function fetchClassesBySchoolId(schoolId: string) {
  if (!schoolId) return [];

  try {
    const res = await apiFetch(`/schools/${schoolId}/classes`);

    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      throw new Error(buildErrorMessage(data, "Failed to fetch classes."));
    }

    const data = await res.json();

    const classes = Array.isArray(data) ? data : data.classes || [];

    return classes.map((c: any): SchoolClassOption => ({
      id: c.id || c.class_id,
      name: c.name || c.class_name,
      teacher: c.teacher_name || c.teacher || "No teacher assigned",
    }));
  } catch (err) {
    console.error("Error fetching classes:", err);
    throw err instanceof Error ? err : new Error("Failed to fetch classes.");
  }
}
