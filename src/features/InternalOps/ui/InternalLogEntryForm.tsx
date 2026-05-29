"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InternalPilotSchool } from "../api/types";

const today = new Date().toISOString().slice(0, 10);

export function InternalLogEntryForm() {
  const router = useRouter();
  const [schools, setSchools] = useState<InternalPilotSchool[]>([]);
  const [form, setForm] = useState({
    log_date: today,
    school_id: "",
    school_name: "",
    location: "Lagos Island",
    class_id: "",
    class_name: "",
    subject: "",
    teacher_name: "",
    students_present: "0",
    lessons_started: "0",
    lessons_completed: "0",
    average_session_time_minutes: "",
    engagement_level: "3",
    simplify_used: "0",
    expand_used: "0",
    slower_used: "0",
    tts_activated: "0",
    esl_simplify_language_access: "0",
    pre_cache_performance: "mixed",
    device_failures: "false",
    device_failure_notes: "",
    connectivity_issues: "false",
    connectivity_notes: "",
    app_errors: "false",
    app_error_notes: "",
    notable_moments: "",
    teacher_confidence_level: "3",
    teacher_feedback: "",
    struggled_and_recovered: "",
    disengaged_throughout: "",
    positive_reaction: "",
    accommodation_working: "",
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
    let isActive = true;
    async function loadSchools() {
      const response = await fetch("/api/internal/pilot/schools", {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => ({ schools: [] }));
      if (isActive) setSchools(data.schools ?? []);
    }
    loadSchools();
    return () => {
      isActive = false;
    };
  }, []);

  function handleSchoolChange(schoolId: string) {
    const selected = schools.find((school) => school.school_id === schoolId);
    setForm((current) => ({
      ...current,
      school_id: schoolId,
      school_name: selected?.school_name ?? "",
      location: selected?.location ?? current.location,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    const response = await fetch("/api/internal/pilot/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        students_present: Number(form.students_present),
        lessons_started: Number(form.lessons_started),
        lessons_completed: Number(form.lessons_completed),
        average_session_time_minutes: form.average_session_time_minutes
          ? Number(form.average_session_time_minutes)
          : null,
        engagement_level: Number(form.engagement_level),
        simplify_used: Number(form.simplify_used),
        expand_used: Number(form.expand_used),
        slower_used: Number(form.slower_used),
        tts_activated: Number(form.tts_activated),
        esl_simplify_language_access: Number(form.esl_simplify_language_access),
        device_failures: form.device_failures === "true",
        connectivity_issues: form.connectivity_issues === "true",
        app_errors: form.app_errors === "true",
        teacher_confidence_level: Number(form.teacher_confidence_level),
      }),
    });
    setSaving(false);

    if (!response.ok) {
      setStatus("Could not save log yet.");
      return;
    }
    router.replace("/internal/pilot");
    router.refresh();
  }

  const inputClass =
    "h-[48px] rounded-[12px] border border-[#3b3f6e22] bg-white/80 px-3 text-[14px] text-[#3b3f6e] outline-none placeholder:text-[#3b3f6e66]";
  const textareaClass =
    "min-h-[96px] rounded-[12px] border border-[#3b3f6e22] bg-white/80 px-3 py-3 text-[14px] text-[#3b3f6e] outline-none placeholder:text-[#3b3f6e66]";

  return (
    <main className="min-h-dvh bg-[#f7f1e6] text-[#3b3f6e]">
      <section className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-8">
        <header className="flex h-14 items-center justify-between">
          <Link className="text-[22px]" href="/internal/pilot">
            Back
          </Link>
          <h1 className="text-[17px] font-semibold">Log entry</h1>
          <button
            className="rounded-full bg-[#3b3f6e] px-4 py-2 text-[13px] font-semibold text-[#f7f1e6] disabled:opacity-50"
            disabled={saving || !form.school_name || !form.class_name}
            form="internal-log-form"
            type="submit"
          >
            Save
          </button>
        </header>

        <form className="space-y-4" id="internal-log-form" onSubmit={handleSubmit}>
          <input
            className={inputClass}
            onChange={(event) => updateField("log_date", event.target.value)}
            type="date"
            value={form.log_date}
          />
          <select
            className={inputClass}
            onChange={(event) => handleSchoolChange(event.target.value)}
            value={form.school_id}
          >
            <option value="">Select school</option>
            {schools.map((school) => (
              <option key={school.school_id} value={school.school_id}>
                {school.school_name}
              </option>
            ))}
          </select>
          {!schools.length ? (
            <input
              className={inputClass}
              onChange={(event) => updateField("school_name", event.target.value)}
              placeholder="School"
              value={form.school_name}
            />
          ) : null}
          <select
            className={inputClass}
            onChange={(event) => updateField("location", event.target.value)}
            value={form.location}
          >
            <option>Lagos Island</option>
            <option>Lagos Mainland</option>
          </select>
          <input
            className={inputClass}
            onChange={(event) => updateField("class_name", event.target.value)}
            placeholder="Class"
            value={form.class_name}
          />
          <input
            className={inputClass}
            onChange={(event) => updateField("subject", event.target.value)}
            placeholder="Subject"
            value={form.subject}
          />
          <input
            className={inputClass}
            onChange={(event) => updateField("teacher_name", event.target.value)}
            placeholder="Teacher name"
            value={form.teacher_name}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              max="5"
              min="1"
              onChange={(event) => updateField("engagement_level", event.target.value)}
              placeholder="Engagement 1-5"
              type="number"
              value={form.engagement_level}
            />
            <input
              className={inputClass}
              max="5"
              min="1"
              onChange={(event) =>
                updateField("teacher_confidence_level", event.target.value)
              }
              placeholder="Teacher confidence 1-5"
              type="number"
              value={form.teacher_confidence_level}
            />
          </div>

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#3b3f6e99]">
            Completion
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["students_present", "Students present"],
              ["lessons_started", "Lessons started"],
              ["lessons_completed", "Lessons completed"],
              ["average_session_time_minutes", "Avg session mins"],
            ].map(([name, placeholder]) => (
              <input
                className={inputClass}
                key={name}
                min="0"
                onChange={(event) => updateField(name, event.target.value)}
                placeholder={placeholder}
                type="number"
                value={form[name as keyof typeof form]}
              />
            ))}
          </div>

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#3b3f6e99]">
            Adaptive controls
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["simplify_used", "Simplify"],
              ["expand_used", "Expand"],
              ["slower_used", "Slower"],
              ["tts_activated", "TTS"],
              ["esl_simplify_language_access", "ESL simplify"],
            ].map(([name, placeholder]) => (
              <input
                className={inputClass}
                key={name}
                min="0"
                onChange={(event) => updateField(name, event.target.value)}
                placeholder={placeholder}
                type="number"
                value={form[name as keyof typeof form]}
              />
            ))}
          </div>

          <select
            className={inputClass}
            onChange={(event) =>
              updateField("pre_cache_performance", event.target.value)
            }
            value={form.pre_cache_performance}
          >
            <option value="served_from_cache_mostly">Served from cache mostly</option>
            <option value="frequent_api_delays">Had frequent API delays</option>
            <option value="mixed">Mixed</option>
          </select>

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#3b3f6e99]">
            Technical
          </p>
          {[
            ["device_failures", "Device failures", "device_failure_notes"],
            ["connectivity_issues", "Connectivity issues", "connectivity_notes"],
            ["app_errors", "App errors", "app_error_notes"],
          ].map(([toggleName, label, notesName]) => (
            <div className="space-y-2" key={toggleName}>
              <select
                className={inputClass}
                onChange={(event) => updateField(toggleName, event.target.value)}
                value={form[toggleName as keyof typeof form]}
              >
                <option value="false">{label}: No</option>
                <option value="true">{label}: Yes</option>
              </select>
              {form[toggleName as keyof typeof form] === "true" ? (
                <textarea
                  className={textareaClass}
                  onChange={(event) => updateField(notesName, event.target.value)}
                  placeholder={`${label} notes`}
                  value={form[notesName as keyof typeof form]}
                />
              ) : null}
            </div>
          ))}

          <textarea
            className={textareaClass}
            onChange={(event) => updateField("notable_moments", event.target.value)}
            placeholder="Notable moments"
            value={form.notable_moments}
          />
          <textarea
            className={textareaClass}
            onChange={(event) => updateField("teacher_feedback", event.target.value)}
            placeholder="Teacher feedback"
            value={form.teacher_feedback}
          />

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#3b3f6e99]">
            Student moments
          </p>
          {[
            ["struggled_and_recovered", "Student who struggled and recovered"],
            ["disengaged_throughout", "Student who was disengaged throughout"],
            ["positive_reaction", "Unprompted positive reaction"],
            ["accommodation_working", "Accommodation observed working"],
          ].map(([name, placeholder]) => (
            <textarea
              className={textareaClass}
              key={name}
              onChange={(event) => updateField(name, event.target.value)}
              placeholder={placeholder}
              value={form[name as keyof typeof form]}
            />
          ))}

          {status ? <p className="text-[13px] text-[#c0392b]">{status}</p> : null}
          <button
            className="h-[52px] w-full rounded-[12px] bg-[#3b3f6e] text-[15px] font-semibold text-[#f7f1e6] disabled:opacity-50"
            disabled={saving || !form.school_name || !form.class_name}
            type="submit"
          >
            {saving ? "Saving..." : "Submit log"}
          </button>
        </form>
      </section>
    </main>
  );
}
