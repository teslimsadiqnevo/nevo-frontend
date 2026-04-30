"use server";

import { apiFetch } from "@/shared/lib/api";

export async function fetchSchools(query: string = "") {
  try {
    const res = await apiFetch(
      `/schools/search?q=${encodeURIComponent(query)}`,
    );

    if (!res.ok) {
      console.error("Failed to fetch schools:", res.status);
      return [];
    }

    const data = await res.json();
    console.log("fetchSchools", data);

    const schools = Array.isArray(data) ? data : data.schools || [];

    return schools.map((s: any) => ({
      id: s.id || s.school_id,
      name: s.name || s.school_name,
      location: s.location || s.state || "",
    }));
  } catch (err) {
    console.error("Error fetching schools:", err);
    return [];
  }
}

export async function fetchClassesBySchoolId(schoolId: string) {
  if (!schoolId) return [];

  try {
    const res = await apiFetch(`/schools/${schoolId}/classes`);

    if (!res.ok) {
      console.error("Failed to fetch classes:", res.status);
      return [];
    }

    const data = await res.json();

    const classes = Array.isArray(data) ? data : data.classes || [];

    return classes.map((c: any) => ({
      id: c.id || c.class_id,
      name: c.name || c.class_name,
      teacher: c.teacher_name || c.teacher || "No teacher assigned",
    }));
  } catch (err) {
    console.error("Error fetching classes:", err);
    return [];
  }
}
