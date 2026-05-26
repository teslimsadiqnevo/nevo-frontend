"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const today = new Date().toISOString().slice(0, 10);

export function InternalLogEntryForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    log_date: today,
    school_name: "",
    location: "Lagos Island",
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
    notable_moments: "",
    teacher_confidence_level: "3",
    teacher_feedback: "",
  });
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
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
    "h-[48px] rounded-[12px] border border-[#f7f1e633] bg-[#2b2b2f99] px-3 text-[14px] text-[#f7f1e6] outline-none placeholder:text-[#f7f1e64d]";
  const textareaClass =
    "min-h-[96px] rounded-[12px] border border-[#f7f1e633] bg-[#2b2b2f99] px-3 py-3 text-[14px] text-[#f7f1e6] outline-none placeholder:text-[#f7f1e64d]";

  return (
    <main className="min-h-dvh bg-[#3b3f6e] text-[#f7f1e6]">
      <section className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pb-8">
        <header className="flex h-14 items-center justify-between">
          <Link className="text-[22px]" href="/internal/pilot">
            Back
          </Link>
          <h1 className="text-[17px] font-semibold">Log entry</h1>
          <button
            className="rounded-full bg-[#f7f1e6] px-4 py-2 text-[13px] font-semibold text-[#3b3f6e] disabled:opacity-50"
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
          <input
            className={inputClass}
            onChange={(event) => updateField("school_name", event.target.value)}
            placeholder="School"
            value={form.school_name}
          />
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

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#f7f1e680]">
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

          <p className="pt-2 text-[11px] uppercase tracking-[0.08em] text-[#f7f1e680]">
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

          {status ? <p className="text-[13px] text-[#c0392b]">{status}</p> : null}
          <button
            className="h-[52px] w-full rounded-[12px] bg-[#f7f1e6] text-[15px] font-semibold text-[#3b3f6e] disabled:opacity-50"
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
