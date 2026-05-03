"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/widgets/StudentSidebar";
import {
  getStudentDashboard,
  getStudentLessons,
  getStudentProfile,
  getStudentProgress,
  getStudentConnections,
  updateStudentSettings,
} from "../api/student";
import { useRegistrationStore } from "@/shared/store/useRegistrationStore";
import { signOut } from "next-auth/react";
import { StudentProgressPanel } from "./StudentProgressPanel";
import { useAuthGuard } from "@/shared/lib";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type Lesson = {
  id: number | string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  duration: string;
  status: "completed" | "in_progress" | "not_started";
  objectives?: string[];
  bannerColor?: string;
  stepProgress?: {
    currentStep: number;
    totalSteps: number;
    progressPercentage: number;
  };
};

// ─── Subject pill color map ────────────────────────────────────────────────────
const subjectColors: Record<
  string,
  { bg: string; text: string; banner: string }
> = {
  History: { bg: "#F0DCC0", text: "#8B6914", banner: "#C8B896" },
  Science: { bg: "#D4EDDA", text: "#2D6A4F", banner: "#8BC4A0" },
  Mathematics: { bg: "#DDD8F0", text: "#3B3F6E", banner: "#A9A5D1" },
  Literature: { bg: "#F5E0E9", text: "#8B3A62", banner: "#D4A0B8" },
  Geography: { bg: "#D6EAF3", text: "#1B6B8A", banner: "#8BBEDB" },
};

// ─── Main Component ────────────────────────────────────────────────────────────
export function StudentDashboard({
  view = "home",
  user,
}: {
  view?: string;
  user?: any;
}) {
  const guardAuth = useAuthGuard("student");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  // States for real data mapped to local format
  const [assignedLessons, setAssignedLessons] = useState<Lesson[]>([]);
  const [recommendedLessons, setRecommendedLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [teacherLessons, setTeacherLessons] = useState<Lesson[]>([]);
  const [completedLessons, setCompletedLessons] = useState<Lesson[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const clearRegistration = useRegistrationStore(
    (state) => state.clearRegistration,
  );
  const userIdentity =
    user?.id || user?.nevoId || user?.email || user?.name || null;

  const resetStudentState = () => {
    setSelectedLesson(null);
    setAssignedLessons([]);
    setRecommendedLessons([]);
    setCurrentLesson(null);
    setTeacherLessons([]);
    setCompletedLessons([]);
    setProfile(null);
    setProgressData(null);
  };

  useEffect(() => {
    if (!userIdentity) {
      resetStudentState();
      setStudentName("");
      setLoading(false);
      return;
    }

    // Clear any previous registration flow leftovers once a student session is active.
    clearRegistration();

    async function loadData() {
      setLoading(true);
      resetStudentState();
      try {
        // Fetch from real backend
        const [dashRes, lessRes, profRes, progRes, connRes] = await Promise.all(
          [
            getStudentDashboard(),
            getStudentLessons(),
            getStudentProfile(),
            getStudentProgress(),
            getStudentConnections(),
          ],
        );

        if (guardAuth([dashRes as any, lessRes as any, profRes as any, progRes as any, connRes as any])) {
          return;
        }

        if (profRes.data) setProfile(profRes.data);
        if (progRes.data) setProgressData(progRes.data);
        if (connRes.data) {
          setProfile((prev: any) => ({
            ...(prev || {}),
            connections: connRes.data,
          }));
        }

        const rawDashboard = dashRes.data || {};
        const rawLessons = lessRes.data || {};

        const toLessonCard = (item: any): Lesson => {
          const estimatedMinutes = Number(
            item?.estimated_duration_minutes ??
              item?.estimatedDurationMinutes ??
              item?.duration_minutes ??
              item?.durationMinutes ??
              30,
          );
          return {
            id:
              item?.lesson_id ||
              item?.id ||
              item?.lessonId ||
              `${item?.title || "lesson"}-${estimatedMinutes}`,
            title: item?.title || "Lesson",
            subject: item?.subject || "Subject",
            topic: item?.topic || "Topic",
            grade: item?.grade || `~${estimatedMinutes} min`,
            duration: `${estimatedMinutes} min`,
            status: item?.status || "not_started",
            objectives: item?.objectives || [],
            stepProgress:
              item?.progress_percentage != null ||
              item?.current_step != null ||
              item?.total_steps != null
                ? {
                    currentStep: Number(
                      item?.current_step ?? item?.currentStep ?? 0,
                    ),
                    totalSteps: Number(
                      item?.total_steps ?? item?.totalSteps ?? 0,
                    ),
                    progressPercentage: Number(
                      item?.progress_percentage ??
                        item?.progressPercentage ??
                        0,
                    ),
                  }
                : undefined,
          };
        };

        const currentLessonSource =
          rawDashboard.current_lesson || rawLessons.current_lesson || null;
        const assignedSource = Array.isArray(rawDashboard.assigned_lessons)
          ? rawDashboard.assigned_lessons
          : Array.isArray(rawLessons.teacher_lessons)
            ? rawLessons.teacher_lessons
            : [];
        const recommendedSource = Array.isArray(
          rawDashboard.recommended_lessons,
        )
          ? rawDashboard.recommended_lessons
          : Array.isArray(rawLessons.recommended_lessons)
            ? rawLessons.recommended_lessons
            : [];
        const completedSource = Array.isArray(rawLessons.completed_lessons)
          ? rawLessons.completed_lessons
          : [];

        const mappedAssigned = assignedSource.map(toLessonCard);
        const mappedRecommended = recommendedSource.map(toLessonCard);
        const mappedCompleted = completedSource.map((item: any) => ({
          ...toLessonCard(item),
          status: "completed" as const,
        }));

        setStudentName(rawDashboard.student_name || user?.name || "Student");
        setCurrentLesson(
          currentLessonSource
            ? {
                ...toLessonCard(currentLessonSource),
                status: "in_progress",
              }
            : null,
        );
        setAssignedLessons(mappedAssigned);
        setTeacherLessons(mappedAssigned);
        setCompletedLessons(mappedCompleted);
        setRecommendedLessons(mappedRecommended);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userIdentity, clearRegistration]);

  const handleStudentLogout = async () => {
    clearRegistration();
    await signOut({ callbackUrl: "/login/student" });
  };

  return (
    <div className="flex bg-[#F7F1E6] font-sans h-screen w-full overflow-hidden">
      <StudentSidebar />
      <main className="flex-1 overflow-y-auto relative px-[44px] py-[32px]">
        {selectedLesson ? (
          <LessonDetailView
            lesson={selectedLesson}
            onBack={() => setSelectedLesson(null)}
          />
        ) : view === "lessons" ? (
          <div>
            <StudentLessonsView
              onSelectLesson={setSelectedLesson}
              currentLesson={currentLesson}
              teacherLessons={teacherLessons}
              completedLessons={completedLessons}
            />
          </div>
        ) : view === "downloads" ? (
          <div>
            <StudentDownloadsView />
          </div>
        ) : view === "progress" ? (
          <div>
            <StudentProgressPanel progressData={progressData} />
          </div>
        ) : view === "connect" ? (
          <div>
            <StudentConnectView profile={profile} />
          </div>
        ) : view === "profile" ? (
          <div>
            <StudentProfileView
              user={user}
              profile={profile}
              onLogout={handleStudentLogout}
            />
          </div>
        ) : (
          <div>
            <StudentHomeView
              onSelectLesson={setSelectedLesson}
              user={user}
              studentName={studentName}
              assignedLessons={assignedLessons}
              recommendedLessons={recommendedLessons}
              currentLesson={currentLesson}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Home View ─────────────────────────────────────────────────────────────────
function StudentHomeView({
  onSelectLesson,
  user,
  studentName,
  assignedLessons,
  recommendedLessons,
  currentLesson,
}: {
  onSelectLesson: (lesson: Lesson) => void;
  user?: any;
  studentName?: string;
  assignedLessons: Lesson[];
  recommendedLessons: Lesson[];
  currentLesson: Lesson | null;
}) {
  const firstName =
    (studentName || user?.name || "Student").split(" ")[0] || "Student";
  const progress = currentLesson?.stepProgress || {
    currentStep: 2,
    totalSteps: 5,
    progressPercentage: 40,
  };

  return (
    <div className="w-[716px] flex flex-col gap-[40px]">
      {/* Greeting */}
      <div>
        <h1 className="text-[40px] font-bold text-[#2B2B2F] leading-[50px]">
          Hi, {firstName}.
        </h1>
        <p className="text-[18px] font-medium text-[#2B2B2F]/80 leading-[27px] mt-1">
          Ready to continue where you left off?
        </p>
      </div>

      {/* Continue Lesson Hero */}
      {currentLesson ? (
        <div
          className="w-full bg-[#FCFCFC] rounded-[24px] border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-[33px] flex flex-col gap-6 cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow box-border"
          onClick={() => onSelectLesson(currentLesson)}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.3px] uppercase">
              {currentLesson.subject} · {currentLesson.topic}
            </span>
            <h2 className="text-[32px] font-bold text-[#2B2B2F] leading-[40px]">
              {currentLesson.title}
            </h2>
          </div>

          <div className="w-[622px] h-[120px] bg-[#F7F1E6] rounded-[16px] relative overflow-hidden border border-black/5">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F7F1E6] via-[#F7F1E6]/80 to-transparent flex items-center px-8 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
                  <div className="w-8 h-8 bg-[#3B3F6E] rounded-full flex items-center justify-center relative">
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-[#FCFCFC] border-b-[5px] border-b-transparent ml-1" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-bold text-[#3B3F6E]">
                    Step {progress.currentStep} of {progress.totalSteps}
                  </span>
                  <div className="w-[128px] h-[6px] bg-black/10 rounded-full overflow-hidden relative">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#3B3F6E] rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress.progressPercentage))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between w-[622px] pt-2">
            <span className="text-[14px] font-medium text-black/60">
              Pick up from Step {progress.currentStep}
            </span>
            <button
              className="px-8 py-4 bg-[#3B3F6E] hover:bg-[#2C2F52] text-[#FCFCFC] rounded-2xl text-[16px] font-semibold transition-colors cursor-pointer shadow-[0_4px_6px_-1px_rgba(59,63,110,0.2),0_2px_4px_-2px_rgba(59,63,110,0.2)]"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLesson(currentLesson);
              }}
            >
              Continue Lesson
            </button>
          </div>
        </div>
      ) : (
        <DashboardEmptyState
          variant="book"
          className="h-[364px]"
          title="Your lessons will appear here"
          description="Your teacher will assign lessons soon."
        />
      )}

      {/* Assigned Section */}
      <section className="w-[720px]">
        <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">
          Assigned
        </h3>
        {assignedLessons.length > 0 ? (
          <div className="flex gap-4">
            {assignedLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={() => onSelectLesson(lesson)}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            variant="book"
            className="h-[208px]"
            title="No lessons assigned yet"
            description="Check back soon — your teacher will send lessons your way."
          />
        )}
      </section>

      {/* Recommended Section */}
      <section className="w-[720px] pb-12">
        <h3 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">
          Recommended for you
        </h3>
        {recommendedLessons.length > 0 ? (
          <div className="flex gap-4">
            {recommendedLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={() => onSelectLesson(lesson)}
              />
            ))}
          </div>
        ) : (
          <DashboardEmptyState
            variant="lightbulb"
            className="h-[208px]"
            title="Recommendations loading"
            description="Complete a lesson first and we'll suggest what's next."
          >
            <button className="px-6 py-[6px] border border-[#3B3F6E] rounded-xl text-[14px] font-medium text-[#3B3F6E] mt-1 hover:bg-[#3B3F6E] hover:text-[#FCFCFC] transition-colors cursor-pointer">
              Browse all lessons
            </button>
          </DashboardEmptyState>
        )}
      </section>
    </div>
  );
}

function DashboardEmptyState({
  variant,
  title,
  description,
  className = "",
  children,
}: {
  variant: "book" | "lightbulb";
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`w-full bg-[#FCFCFC] rounded-[16px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center border border-black/5 box-border ${className}`}
    >
      <DashboardEmptyIcon variant={variant} />
      <h3
        className={`font-semibold text-[#2B2B2F] text-center ${variant === "book" ? "text-[16px] mb-2" : "text-[14px] mb-1"}`}
      >
        {title}
      </h3>
      <p
        className={`text-[#2B2B2F]/55 text-center ${variant === "book" ? "text-[14px]" : "text-[12px]"}`}
      >
        {description}
      </p>
      {children}
    </div>
  );
}

function DashboardEmptyIcon({ variant }: { variant: "book" | "lightbulb" }) {
  if (variant === "book") {
    return (
      <div className="w-20 h-20 bg-[#9A9CCB]/30 rounded-[12px] flex items-center justify-center mb-4 border-[2.5px] border-[#9A9CCB]">
        <svg
          width="40"
          height="40"
          viewBox="0 0 80 96"
          fill="none"
          className="scale-[0.85]"
          aria-hidden="true"
        >
          <path
            d="M0 12C0 5.37258 5.37258 0 12 0H68C74.6274 0 80 5.37258 80 12V68C80 74.6274 74.6274 80 68 80H12C5.37258 80 0 74.6274 0 68V12Z"
            fill="#9A9CCB"
            fillOpacity="0.3"
          />
          <path
            d="M40 32.5C41.25 27.5656 45.9711 25.0461 56.25 25C56.4143 24.9994 56.5772 25.0313 56.7291 25.0939C56.881 25.1565 57.0191 25.2485 57.1353 25.3647C57.2515 25.4809 57.3435 25.619 57.4061 25.7709C57.4687 25.9229 57.5006 26.0857 57.5 26.25V48.75C57.5 49.0815 57.3683 49.3995 57.1339 49.6339C56.8995 49.8683 56.5815 50 56.25 50C46.25 50 42.3867 52.0164 40 55M40 32.5C38.75 27.5656 34.0289 25.0461 23.75 25C23.5857 24.9994 23.4229 25.0313 23.2709 25.0939C23.119 25.1565 22.9809 25.2485 22.8647 25.3647C22.7485 25.4809 22.6565 25.619 22.5939 25.7709C22.5313 25.9229 22.4994 26.0857 22.5 26.25V48.5992C22.5 49.3711 22.9781 50 23.75 50C33.75 50 37.6274 52.0313 40 55M40 32.5V55"
            stroke="#9A9CCB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-20 h-20 bg-[#9A9CCB]/30 rounded-[12px] flex items-center justify-center mb-3 border-[2.5px] border-[#9A9CCB]">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 4C13.3726 4 8 9.37258 8 16C8 20.3869 10.385 24.2018 14 26.2361V31C14 32.1046 14.8954 33 16 33H24C25.1046 33 26 32.1046 26 31V26.2361C29.615 24.2018 32 20.3869 32 16C32 9.37258 26.6274 4 20 4Z"
          stroke="#9A9CCB"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M17 36H23"
          stroke="#9A9CCB"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M20 10V14"
          stroke="#9A9CCB"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M13.5 16H17.5"
          stroke="#9A9CCB"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M22.5 16H26.5"
          stroke="#9A9CCB"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// ─── Lesson Card ───────────────────────────────────────────────────────────────
function LessonCard({
  lesson,
  onClick,
}: {
  lesson: Lesson;
  onClick: () => void;
}) {
  const pill = subjectColors[lesson.subject] || {
    bg: "#E9E7E2",
    text: "#3B3F6E",
    banner: "#C8C8C8",
  };

  return (
    <div
      className="w-[160px] h-[200px] bg-[#F7F1E6] rounded-[12px] border border-[#E0D9CE] p-[1px] box-border cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] transition-shadow group flex flex-col"
      onClick={onClick}
    >
      {/* Image placeholder / top box */}
      <div className="w-[156px] h-[80px] bg-[#9A9CCB]/15 rounded-t-[10px] shrink-0" />

      {/* Content */}
      <div className="flex flex-col px-4 py-3 gap-2 flex-1">
        <h4 className="text-[14px] font-semibold text-[#3B3F6E] leading-[21px] line-clamp-2">
          {lesson.title}
        </h4>
        <div className="mt-auto flex flex-col items-start gap-1">
          <span
            className="inline-flex px-3 py-1 rounded-full text-[11px] font-medium"
            style={{ backgroundColor: pill.bg, color: pill.text }}
          >
            {lesson.subject}
          </span>
          <p className="text-[12px] text-black/60 mt-1">{lesson.duration}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Lessons View ──────────────────────────────────────────────────────────────
function StudentLessonsView({
  onSelectLesson,
  currentLesson,
  teacherLessons,
  completedLessons,
}: {
  onSelectLesson: (lesson: Lesson) => void;
  currentLesson: Lesson | null;
  teacherLessons: Lesson[];
  completedLessons: Lesson[];
}) {
  const [completedOpen, setCompletedOpen] = useState(false);

  return (
    <div className="w-full max-w-[688px]">
      {/* Header */}
      <h1 className="text-40px font-extrabold text-[#2B2B2F] leading-12.5 tracking-[-1px]">
        Lessons
      </h1>
      <p className="text-[18px] font-medium text-[#2B2B2F]/80 leading-6.75 mt-2 mb-8">
        Your current learning steps.
      </p>

      {/* Current Lesson Hero */}
      <section className="mb-10">
        {currentLesson ? (
          <div
            className="w-full rounded-3xl border border-black/5 bg-[#FCFCFC] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
            onClick={() => onSelectLesson(currentLesson)}
          >
            <div className="flex items-start justify-between gap-8">
              <div className="flex w-[312px] flex-col justify-between min-h-[221px]">
                <div className="w-full">
                  <span className="text-[12px] font-bold uppercase tracking-[0.6px] text-[#3B3F6E]">
                    {currentLesson.subject} · {currentLesson.topic}
                  </span>
                  <h2 className="mt-4 text-[32px] font-bold leading-[35px] text-[#2B2B2F]">
                    {currentLesson.title}
                  </h2>

                  <span className="mt-6 inline-flex items-center rounded-full bg-[#F7F1E6] px-3 py-1 text-[14px] font-medium leading-[21px] text-[#2B2B2F]/60">
                    Step {currentLesson.stepProgress?.currentStep || 2} in
                    progress
                  </span>
                </div>

                <button
                  className="mt-4 flex h-[56px] w-[158px] items-center gap-2 rounded-2xl bg-[#3B3F6E] px-8 text-[16px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(59,63,110,0.2),0_2px_4px_-2px_rgba(59,63,110,0.2)] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLesson(currentLesson);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="white" />
                  </svg>
                  Continue
                </button>
              </div>

              <div className="relative h-[180px] w-[280px] overflow-hidden rounded-2xl bg-[#F7F1E6]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,63,110,0.1)_0%,rgba(0,0,0,0)_100%)]" />
                <Image
                  src="/images/lessons.png"
                  alt="Lesson preview"
                  fill
                  className="object-cover opacity-90"
                  sizes="280px"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between px-0 pt-2">
              <div>
                <span className="text-[12px] font-semibold text-black/40">
                  Progress
                </span>
              </div>
              <span className="text-[12px] font-semibold text-black/40">
                {Math.round(
                  currentLesson.stepProgress?.progressPercentage || 40,
                )}
                %
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3B3F6E]"
                style={{
                  width: `${Math.max(20, currentLesson.stepProgress?.progressPercentage || 40)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <StudentLessonsEmptyState
            variant="book"
            className="h-[351px]"
            title="No active lesson yet"
            description="Your teacher will assign the next lesson here."
          />
        )}
      </section>

      <section className="mb-10">
        <h3 className="mb-5 text-[20px] font-bold text-[#2B2B2F]">
          From your teacher
        </h3>
        {teacherLessons.length > 0 ? (
          <div className="grid grid-cols-2 gap-5">
            {teacherLessons.map((lesson) => (
              <TeacherLessonCard
                key={lesson.id}
                lesson={lesson}
                onClick={() => onSelectLesson(lesson)}
              />
            ))}
          </div>
        ) : (
          <StudentLessonsEmptyState
            variant="lightbulb"
            className="h-[240px]"
            title="No teacher lessons yet"
            description="Assigned lessons will appear here once your teacher publishes them."
          />
        )}
      </section>

      <section className="border-t border-black/5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCompletedOpen(!completedOpen)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={`transition-transform duration-200 ${completedOpen ? "rotate-0" : "-rotate-90"}`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="#3B3F6E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[15px] font-bold text-[#3B3F6E] group-hover:text-[#2C2F52]">
              Completed
            </span>
          </button>
          <a
            href="#"
            className="flex items-center gap-1 text-[13px] font-semibold text-[#3B3F6E] transition-colors hover:text-[#2C2F52]"
          >
            View past lessons
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </div>

        {completedOpen && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in">
            {completedLessons.length > 0 ? (
              completedLessons.map((lesson) => (
                <CompletedLessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => onSelectLesson(lesson)}
                />
              ))
            ) : (
              <StudentLessonsEmptyState
                variant="lightbulb"
                className="h-[240px]"
                title="No completed lessons yet"
                description="Finished lessons will show up here after you complete them."
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StudentLessonsEmptyState({
  variant,
  title,
  description,
  className = "",
}: {
  variant: "book" | "lightbulb";
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-[16px] border border-black/5 bg-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${className} flex flex-col items-center justify-center`}
    >
      {variant === "book" ? (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-xl border-[2.5px] border-[#9A9CCB] bg-[#9A9CCB]/30">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M20 8C15.5817 8 12 11.5817 12 16V28C12 29.1046 12.8954 30 14 30H20"
              stroke="#9A9CCB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 8C24.4183 8 28 11.5817 28 16V28C28 29.1046 27.1046 30 26 30H20"
              stroke="#9A9CCB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 8V30"
              stroke="#9A9CCB"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : (
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-xl border-[2.5px] border-[#9A9CCB] bg-[#9A9CCB]/30">
          <svg
            width="38"
            height="38"
            viewBox="0 0 38 38"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M19 9C22.866 9 26 12.134 26 16C26 21 19 29 19 29C19 29 12 21 12 16C12 12.134 15.134 9 19 9Z"
              stroke="#9A9CCB"
              strokeWidth="2.2"
            />
            <circle cx="19" cy="16" r="2.5" fill="#9A9CCB" />
          </svg>
        </div>
      )}
      <h3
        className={`text-center font-semibold text-[#2B2B2F] ${variant === "book" ? "text-[16px] mb-2" : "text-[14px] mb-1"}`}
      >
        {title}
      </h3>
      <p
        className={`max-w-[320px] text-center text-[#2B2B2F]/55 ${variant === "book" ? "text-[14px]" : "text-[12px]"}`}
      >
        {description}
      </p>
      {variant === "lightbulb" ? (
        <button className="mt-4 rounded-xl border border-[#3B3F6E] bg-transparent px-5 py-1.5 text-[14px] font-medium text-[#3B3F6E] cursor-pointer">
          Browse all lessons
        </button>
      ) : null}
    </div>
  );
}

// ─── Teacher Lesson Card ───────────────────────────────────────────────────────
function TeacherLessonCard({
  lesson,
  onClick,
}: {
  lesson: Lesson;
  onClick: () => void;
}) {
  const imageUrl = getLessonImageUrl(lesson);

  return (
    <div
      className="box-border flex h-[184px] flex-col justify-between rounded-[20px] border border-black/5 bg-[#FCFCFC] p-[25px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#F7F1E6] shrink-0">
          <Image
            src={imageUrl}
            alt={lesson.title}
            fill
            className="object-cover opacity-90"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[18px] font-bold leading-[25px] text-[#2B2B2F]">
            {lesson.title}
          </h4>
          <p className="mt-1 text-[13px] font-medium text-[#2B2B2F]/50">
            {lesson.subject}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="flex h-[41px] items-center justify-center rounded-xl border-2 border-[rgba(59,63,110,0.1)] bg-transparent px-5 text-[14px] font-bold text-[#3B3F6E] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}

// ─── Completed Lesson Row ──────────────────────────────────────────────────────
function CompletedLessonRow({
  lesson,
  onClick,
}: {
  lesson: Lesson;
  onClick: () => void;
}) {
  const dateMap: Record<number, string> = {
    20: "Apr 20",
    21: "Apr 18",
    22: "Apr 15",
  };

  return (
    <div
      className="flex items-center gap-3 bg-white rounded-xl border border-[#E9E7E2] px-5 py-4 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
      onClick={onClick}
    >
      {/* Check icon */}
      <div className="w-8 h-8 rounded-full bg-[#E8F5E9] flex items-center justify-center shrink-0">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="#2D6A4F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-[#2B2B2F]">
          {lesson.title}
        </p>
        <p className="text-[11.5px] text-graphite-40">{lesson.subject}</p>
      </div>

      {/* Date */}
      <span className="text-[12px] text-graphite-40 shrink-0">
        {dateMap[lesson.id as number] || ""}
      </span>
    </div>
  );
}

function getLessonImageUrl(lesson: Lesson) {
  const lessonAny = lesson as Lesson & {
    image_url?: string;
    media_url?: string;
    imageUrl?: string;
  };
  return (
    lessonAny.image_url ||
    lessonAny.media_url ||
    lessonAny.imageUrl ||
    "/images/lessons.png"
  );
}

// ─── Lesson Detail View ────────────────────────────────────────────────────────
function LessonDetailView({
  lesson,
  onBack,
}: {
  lesson: Lesson;
  onBack: () => void;
}) {
  const [downloadOffline, setDownloadOffline] = useState(false);
  const colors = subjectColors[lesson.subject] || {
    bg: "#E9E7E2",
    text: "#3B3F6E",
    banner: "#C0BDD4",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Banner */}
        <div
          className="relative w-full h-[260px]"
          style={{ backgroundColor: colors.banner }}
        >
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/35 transition-colors cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Decorative pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-15">
            <svg
              viewBox="0 0 600 260"
              fill="none"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="480" cy="60" r="120" stroke="white" strokeWidth="1" />
              <circle
                cx="480"
                cy="60"
                r="80"
                stroke="white"
                strokeWidth="0.5"
              />
              <circle
                cx="120"
                cy="200"
                r="100"
                stroke="white"
                strokeWidth="0.8"
              />
              <line
                x1="0"
                y1="130"
                x2="600"
                y2="130"
                stroke="white"
                strokeWidth="0.3"
              />
              <line
                x1="300"
                y1="0"
                x2="300"
                y2="260"
                stroke="white"
                strokeWidth="0.3"
              />
            </svg>
          </div>

          {/* Subject label centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-[22px] font-semibold tracking-wide">
              {lesson.subject}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="px-[48px] py-8">
          {/* Title */}
          <h1 className="text-[24px] font-bold text-[#2B2B2F] tracking-[-0.01em] mb-4">
            {lesson.title}
          </h1>

          {/* Meta pills */}
          <div className="flex items-center gap-3 mb-8">
            <span
              className="px-3 py-[5px] rounded-full text-[12px] font-semibold uppercase tracking-[0.04em]"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {lesson.subject}
            </span>
            {lesson.grade && (
              <span className="px-3 py-[5px] rounded-full text-[12px] font-semibold uppercase tracking-[0.04em] bg-[#EEECEA] text-graphite-60">
                {lesson.grade}
              </span>
            )}
            <span className="text-[13px] text-graphite-60 font-medium">
              {lesson.duration}
            </span>
          </div>

          {/* What you'll learn */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="mb-8">
              <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">
                What you&apos;ll learn
              </h3>
              <ul className="flex flex-col gap-3">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-[6px] h-[6px] rounded-full bg-[#3B3F6E] shrink-0 mt-[7px]" />
                    <span className="text-[14px] text-[#2B2B2F] leading-relaxed">
                      {obj}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Download for offline use */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {/* Download icon */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="none"
                className="text-graphite-60"
              >
                <path
                  d="M10 3V13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 10L10 14L14 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 15V16C3 16.5523 3.44772 17 4 17H16C16.5523 17 17 16.5523 17 16V15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[14px] text-[#2B2B2F] font-medium">
                Download for offline use
              </span>
            </div>
            {/* Toggle */}
            <button
              onClick={() => setDownloadOffline(!downloadOffline)}
              className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 cursor-pointer relative ${
                downloadOffline ? "bg-[#3B3F6E]" : "bg-[#D5D3CE]"
              }`}
            >
              <div
                className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  downloadOffline ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-[#E9E7E2] bg-[#F7F1E6] px-[48px] py-5 shrink-0">
        <LessonActionBar lesson={lesson} />
      </div>
    </div>
  );
}

// ─── Lesson Action Bar ─────────────────────────────────────────────────────────
function LessonActionBar({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const lessonPath = `/lesson/${lesson.id}`;

  switch (lesson.status) {
    case "not_started":
      return (
        <button
          onClick={() => router.push(lessonPath)}
          className="w-full py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer"
        >
          Start lesson
        </button>
      );
    case "in_progress":
      return (
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`${lessonPath}/notice`)}
            className="flex-[2] py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer"
          >
            Resume
          </button>
          <button
            onClick={() => router.push(lessonPath)}
            className="flex-1 py-[14px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[15px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer"
          >
            Restart
          </button>
        </div>
      );
    case "completed":
      return (
        <button
          onClick={() => router.push(`${lessonPath}/complete`)}
          className="w-full py-[14px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-xl text-[15px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer"
        >
          Review lesson
        </button>
      );
  }
}

// ─── Downloads Mock Data ───────────────────────────────────────────────────────
interface DownloadedLesson {
  id: number;
  title: string;
  subject: string;
  size: string;
}

// ─── Downloads View ────────────────────────────────────────────────────────────
function StudentDownloadsView() {
  const [lessons, setLessons] = useState<DownloadedLesson[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [removeTarget, setRemoveTarget] = useState<DownloadedLesson | null>(
    null,
  );

  const totalSize = lessons.length * 12;

  const handleRemove = () => {
    if (removeTarget) {
      setLessons((prev) => prev.filter((l) => l.id !== removeTarget.id));
      setRemoveTarget(null);
      setMenuOpenId(null);
    }
  };

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-96px)]">
        <svg
          width="200"
          height="160"
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-6"
        >
          <path
            d="M0 16C0 7.16345 7.16344 0 16 0H184C192.837 0 200 7.16344 200 16V144C200 152.837 192.837 160 184 160H16C7.16344 160 0 152.837 0 144V16Z"
            fill="#9A9CCB"
            fillOpacity="0.15"
          />
          <g clipPath="url(#clip0_762_11150)">
            <path
              d="M152 30H48C43.5817 30 40 33.5817 40 38V102C40 106.418 43.5817 110 48 110H152C156.418 110 160 106.418 160 102V38C160 33.5817 156.418 30 152 30Z"
              stroke="#3B3F6E"
              strokeWidth="2"
            />
            <path
              d="M100 119C101.657 119 103 117.657 103 116C103 114.343 101.657 113 100 113C98.3431 113 97 114.343 97 116C97 117.657 98.3431 119 100 119Z"
              fill="#3B3F6E"
            />
            <path
              d="M100 55V85M100 85L90 75M100 85L110 75"
              stroke="#3B3F6E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <defs>
            <clipPath id="clip0_762_11150">
              <rect
                width="160"
                height="120"
                fill="white"
                transform="translate(20 20)"
              />
            </clipPath>
          </defs>
        </svg>

        <p className="text-[14px] text-graphite-60 font-medium text-center mb-6">
          Download lessons to access them offline.
        </p>

        <button className="px-7 py-[11px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer">
          Browse lessons
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[820px]">
      {/* Offline banner */}
      <div className="bg-[#FFF8E1] border border-[#F5E6A3] rounded-xl px-5 py-3 mb-6 flex items-center gap-3">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2L18 18H2L10 2Z"
            stroke="#B8860B"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="#FFEAA7"
            fillOpacity="0.5"
          />
          <line
            x1="10"
            y1="8"
            x2="10"
            y2="12"
            stroke="#B8860B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="15" r="0.8" fill="#B8860B" />
        </svg>
        <span className="text-[13px] text-[#8B6914] font-medium">
          You&apos;re offline — downloaded lessons are available below.
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-[#3B3F6E] tracking-[-0.01em]">
          Downloads
        </h1>
        <span className="text-[13px] text-graphite-60 font-medium">
          {totalSize} MB used
        </span>
      </div>

      {/* Download list */}
      <div className="flex flex-col gap-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 relative"
          >
            {/* Subject pill */}
            <span
              className="inline-block px-3 py-[4px] rounded-full text-[11px] font-bold uppercase tracking-[0.04em] mb-2"
              style={{
                backgroundColor: subjectColors[lesson.subject]?.bg || "#E9E7E2",
                color: subjectColors[lesson.subject]?.text || "#3B3F6E",
              }}
            >
              {lesson.subject}
            </span>

            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#2B2B2F]">
                {lesson.title}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-graphite-40 font-medium">
                  {lesson.size}
                </span>
                <span className="px-2.5 py-[3px] rounded-full text-[11px] font-semibold bg-[#D4EDDA] text-[#2D6A4F]">
                  Downloaded
                </span>
                {/* 3-dot menu */}
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === lesson.id ? null : lesson.id)
                  }
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3" r="1.2" fill="#8A8D9F" />
                    <circle cx="8" cy="8" r="1.2" fill="#8A8D9F" />
                    <circle cx="8" cy="13" r="1.2" fill="#8A8D9F" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dropdown menu */}
            {menuOpenId === lesson.id && (
              <div className="absolute right-6 top-16 bg-white rounded-xl border border-[#E9E7E2] shadow-[0_4px_16px_rgba(0,0,0,0.1)] py-2 z-20 animate-fade-in">
                <button
                  onClick={() => {
                    setRemoveTarget(lesson);
                    setMenuOpenId(null);
                  }}
                  className="w-full text-left px-5 py-2.5 text-[13px] text-[#C0392B] font-medium hover:bg-[#FEF5F5] transition-colors cursor-pointer"
                >
                  Remove download
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Remove confirmation modal */}
      {removeTarget && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setRemoveTarget(null)}
          />
          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-white rounded-t-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
              {/* Handle */}
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
              </div>

              <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-1">
                Remove from device?
              </h3>
              <p className="text-[14px] text-graphite-60 mb-6">
                {removeTarget.title}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={handleRemove}
                  className="flex-1 py-[13px] bg-transparent border-2 border-[#E8B4B4] text-[#C0392B] rounded-full text-[14px] font-semibold hover:bg-[#FEF5F5] transition-colors cursor-pointer"
                >
                  Remove
                </button>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="flex-1 py-[13px] bg-transparent text-[#3B3F6E] text-[14px] font-semibold hover:bg-[#F3F0EA] rounded-full transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface SubjectDetail {
  name: string;
  concepts: number;
  maxConcepts: number;
  color: string;
  conceptsAttempted: number;
  conceptsUnderstood: number;
  conceptList: { name: string; understood: boolean }[];
  lessons: {
    name: string;
    progress: number;
    total: number;
    complete: boolean;
  }[];
}

// ─── Progress View ─────────────────────────────────────────────────────────────
function StudentProgressView({ progressData }: { progressData?: any }) {
  const [hasProgress, setHasProgress] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectDetail | null>(
    null,
  );

  // Map real data if available
  const displayStats = progressData
    ? [
        { value: "7", label: "days in a row" }, // Streak is currently not returned by backend
        {
          value: String(
            progressData.total_lessons_completed ||
              progressData.total_lessons_started ||
              24,
          ),
          label: "concepts",
        },
        { value: "12", label: "breakthroughs" },
      ]
    : [];

  const rawSubjects =
    progressData?.subject_performance || progressData?.subjects || progressData;
  const displaySubjects =
    rawSubjects &&
    !Array.isArray(rawSubjects) &&
    Object.keys(rawSubjects).length > 0
      ? Object.entries(rawSubjects).map(([subj, perf]: [string, any]) => ({
          name: subj,
          concepts: Math.max(1, Math.round((perf.average_score || 0) / 10)),
          maxConcepts: 15,
          color: "#3B3F6E",
          conceptsAttempted: 5,
          conceptsUnderstood: Math.round(((perf.average_score || 0) / 100) * 5),
          conceptList: [
            {
              name: "Basic concept",
              understood: (perf.average_score || 0) > 50,
            },
            {
              name: "Advanced concept",
              understood: (perf.average_score || 0) > 80,
            },
          ],
          lessons: [
            {
              name: `Introduction to ${subj}`,
              progress: perf.lessons_completed || 1,
              total: 5,
              complete: (perf.lessons_completed || 0) >= 5,
            },
          ],
        }))
      : Array.isArray(rawSubjects)
        ? rawSubjects.map((perf: any) => ({
            name: perf.subject || perf.name || "Subject",
            concepts: perf.concepts_understood || perf.concepts || 0,
            maxConcepts: perf.concepts_attempted || perf.maxConcepts || 15,
            color: perf.color || "#3B3F6E",
            conceptsAttempted:
              perf.concepts_attempted || perf.conceptsAttempted || 0,
            conceptsUnderstood:
              perf.concepts_understood || perf.conceptsUnderstood || 0,
            conceptList: perf.conceptList || [],
            lessons: perf.lessons || [],
          }))
        : [];

  const recentActivity: any[] = Array.isArray(progressData?.recent_activity)
    ? progressData.recent_activity
    : [];

  if (!hasProgress) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-96px)]">
        <div className="relative mb-6">
          <div className="absolute -top-3 left-8 w-[8px] h-[8px] rounded-full bg-[#E5C76B]" />
          <div className="absolute -top-1 right-4 w-[8px] h-[8px] rounded-full bg-[#E5C76B] opacity-60" />
          <div className="absolute bottom-4 -left-2 text-[#D5D3CE] text-[16px] font-light">
            +
          </div>
          <div className="absolute top-6 -right-3 text-[#A9A5D1] text-[14px] font-light">
            ✦
          </div>
          <div className="absolute bottom-2 right-2 text-[#E5C76B] text-[10px]">
            •
          </div>
          <div className="w-[140px] h-[110px] bg-[#EEECEA] rounded-xl flex items-center justify-center">
            <svg width="80" height="70" viewBox="0 0 80 70" fill="none">
              <rect
                x="15"
                y="8"
                width="50"
                height="54"
                rx="4"
                stroke="#C8C6C1"
                strokeWidth="1.5"
                fill="#FDFBF9"
              />
              <rect
                x="20"
                y="8"
                width="45"
                height="54"
                rx="3"
                stroke="#C8C6C1"
                strokeWidth="1.5"
                fill="white"
              />
              <line
                x1="28"
                y1="22"
                x2="55"
                y2="22"
                stroke="#DDD8F0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="28"
                y1="30"
                x2="55"
                y2="30"
                stroke="#DDD8F0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="28"
                y1="38"
                x2="48"
                y2="38"
                stroke="#DDD8F0"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M28 50L35 44L42 47L55 40"
                stroke="#A9A5D1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-[20px] font-bold text-[#3B3F6E] mb-3 text-center">
          Start Your Learning Journey
        </h2>
        <p className="text-[14px] text-graphite-60 text-center max-w-[340px] leading-relaxed mb-6">
          Your progress will show here as you learn. Complete lessons to track
          your achievements and see how far you&apos;ve come.
        </p>
        <button className="px-7 py-[11px] bg-transparent border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[14px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer">
          Start a lesson
        </button>
      </div>
    );
  }

  // Subject detail drill-down
  if (selectedSubject) {
    return (
      <SubjectDetailView
        subject={selectedSubject}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  return (
    <div className="max-w-[820px]">
      {/* Top stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {displayStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]"
          >
            <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">
              {stat.value}
            </div>
            <div className="text-[13px] text-graphite-60 font-medium">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Your Subjects */}
      <section className="mb-10">
        <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">
          Your Subjects
        </h3>
        <div className="flex flex-col gap-4">
          {displaySubjects.map((subj) => {
            const pct = (subj.concepts / subj.maxConcepts) * 100;
            return (
              <div
                key={subj.name}
                className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setSelectedSubject(subj)}
              >
                <span className="text-[14px] font-semibold text-[#2B2B2F] w-[120px] shrink-0">
                  {subj.name}
                </span>
                <div className="flex-1 h-[8px] bg-[#E9E7E2] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: subj.color }}
                  />
                </div>
                <span className="text-[12px] text-graphite-60 font-medium w-[80px] shrink-0 text-right">
                  {subj.concepts} concepts
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent */}
      <section>
        <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">
          Recent
        </h3>
        <div className="flex flex-col gap-0">
          {recentActivity.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-[#F0EDE7] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-[7px] h-[7px] rounded-full bg-[#3B3F6E] shrink-0" />
                <span className="text-[14px] text-[#2B2B2F] font-medium">
                  {item.text}
                </span>
              </div>
              <span className="text-[12px] text-graphite-40 font-medium shrink-0 ml-4">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Subject Detail View ───────────────────────────────────────────────────────
function SubjectDetailView({
  subject,
  onBack,
}: {
  subject: SubjectDetail;
  onBack: () => void;
}) {
  const hasActivity =
    subject.conceptList.length > 0 || subject.lessons.length > 0;

  return (
    <div className="max-w-[820px]">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-8 cursor-pointer group"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="#3B3F6E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[20px] font-bold text-[#3B3F6E] group-hover:text-[#2C2F52] transition-colors">
          {subject.name}
        </span>
      </button>

      {!hasActivity ? (
        /* Empty subject state */
        <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)]">
          <div className="w-[140px] h-[110px] bg-[#EEECEA] rounded-2xl flex items-center justify-center mb-5">
            <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
              {/* Clipboard */}
              <rect
                x="10"
                y="5"
                width="22"
                height="28"
                rx="3"
                stroke="#3B3F6E"
                strokeWidth="1.5"
                fill="none"
              />
              <rect
                x="15"
                y="2"
                width="12"
                height="6"
                rx="2"
                stroke="#3B3F6E"
                strokeWidth="1.2"
                fill="#EEECEA"
              />
              <line
                x1="15"
                y1="15"
                x2="27"
                y2="15"
                stroke="#A9A5D1"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <line
                x1="15"
                y1="20"
                x2="24"
                y2="20"
                stroke="#A9A5D1"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <line
                x1="15"
                y1="25"
                x2="27"
                y2="25"
                stroke="#A9A5D1"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              {/* Compass/gear */}
              <circle
                cx="42"
                cy="22"
                r="10"
                stroke="#3B3F6E"
                strokeWidth="1.5"
                fill="none"
              />
              <circle
                cx="42"
                cy="22"
                r="3"
                stroke="#3B3F6E"
                strokeWidth="1.2"
                fill="none"
              />
              <line
                x1="42"
                y1="12"
                x2="42"
                y2="15"
                stroke="#3B3F6E"
                strokeWidth="1.2"
              />
              <line
                x1="42"
                y1="29"
                x2="42"
                y2="32"
                stroke="#3B3F6E"
                strokeWidth="1.2"
              />
              <line
                x1="32"
                y1="22"
                x2="35"
                y2="22"
                stroke="#3B3F6E"
                strokeWidth="1.2"
              />
              <line
                x1="49"
                y1="22"
                x2="52"
                y2="22"
                stroke="#3B3F6E"
                strokeWidth="1.2"
              />
            </svg>
          </div>
          <p className="text-[14px] text-graphite-60 font-medium">
            No activity in this subject yet.
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <div className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
              <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">
                {subject.conceptsAttempted}
              </div>
              <div className="text-[13px] text-graphite-60 font-medium">
                Concepts attempted
              </div>
            </div>
            <div className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
              <div className="text-[36px] font-bold text-[#3B3F6E] leading-tight mb-1">
                {subject.conceptsUnderstood}
              </div>
              <div className="text-[13px] text-graphite-60 font-medium">
                Concepts understood
              </div>
            </div>
          </div>

          {/* Concepts */}
          {subject.conceptList.length > 0 && (
            <section className="mb-10">
              <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">
                Concepts
              </h3>
              <div className="flex flex-col">
                {subject.conceptList.map((concept) => (
                  <div
                    key={concept.name}
                    className="flex items-center justify-between py-4 border-b border-[#F0EDE7] last:border-b-0"
                  >
                    <span className="text-[14px] text-[#2B2B2F] font-medium">
                      {concept.name}
                    </span>
                    {concept.understood ? (
                      <div className="w-[22px] h-[22px] rounded-full bg-[#4CAF50] flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M3 7L6 10L11 4"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-full border-2 border-[#D5D3CE]" />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lessons */}
          {subject.lessons.length > 0 && (
            <section>
              <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-5">
                Lessons
              </h3>
              <div className="flex flex-col gap-4">
                {subject.lessons.map((lesson) => {
                  const pct = (lesson.progress / lesson.total) * 100;
                  return (
                    <div
                      key={lesson.name}
                      className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-5 py-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          className="shrink-0 opacity-50"
                        >
                          <rect
                            x="3"
                            y="2"
                            width="14"
                            height="16"
                            rx="2"
                            stroke="#3B3F6E"
                            strokeWidth="1.5"
                          />
                          <line
                            x1="7"
                            y1="6"
                            x2="13"
                            y2="6"
                            stroke="#3B3F6E"
                            strokeWidth="1"
                            strokeLinecap="round"
                          />
                          <line
                            x1="7"
                            y1="10"
                            x2="13"
                            y2="10"
                            stroke="#3B3F6E"
                            strokeWidth="1"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[14px] font-semibold text-[#2B2B2F] flex-1">
                          {lesson.name}
                        </span>
                        <span className="text-[12px] text-graphite-60 font-medium shrink-0">
                          {lesson.complete ? (
                            <span className="flex items-center gap-1">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 14 14"
                                fill="none"
                              >
                                <path
                                  d="M3 7L6 10L11 4"
                                  stroke="#4CAF50"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Complete
                            </span>
                          ) : (
                            `${lesson.progress}/${lesson.total} activities`
                          )}
                        </span>
                      </div>
                      <div className="w-full h-[5px] bg-[#E9E7E2] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3B3F6E] rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ─── Profile Config Data ─────────────────────────────────────────────────────────
function StudentConnectView({ profile }: { profile?: any }) {
  const [classCode, setClassCode] = useState("");
  const [copied, setCopied] = useState(false);

  const nevoId = profile?.nevo_id || "NEVO-XXXX";

  const handleCopy = () => {
    navigator.clipboard?.writeText(nevoId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[820px]">
      {/* Header */}
      <h1 className="text-[32px] font-bold text-[#3B3F6E] leading-tight tracking-[-0.02em]">
        Connect
      </h1>
      <p className="text-graphite-60 text-[15px] mt-2 mb-8">
        Your learning connections.
      </p>

      {/* Nevo ID Card */}
      <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 mb-8 flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase">
            Your Nevo ID
          </span>
          <h2 className="text-[28px] font-bold text-[#2B2B2F] tracking-[-0.01em] mt-1 mb-4">
            {nevoId}
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-[7px] border-2 border-[#E9E7E2] rounded-full text-[12px] font-semibold text-[#3B3F6E] bg-parchment transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect
                  x="5"
                  y="5"
                  width="9"
                  height="9"
                  rx="1.5"
                  stroke="#3B3F6E"
                  strokeWidth="1.3"
                />
                <path
                  d="M3 11V3C3 2.44772 3.44772 2 4 2H12"
                  stroke="#3B3F6E"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              {copied ? "Copied!" : "Copy ID"}
            </button>
            <button className="flex items-center gap-2 px-4 py-[7px] border-2 border-[#E9E7E2] rounded-full text-[12px] font-semibold text-[#3B3F6E] bg-parchment transition-colors cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect
                  x="2"
                  y="2"
                  width="5"
                  height="5"
                  rx="0.5"
                  stroke="#3B3F6E"
                  strokeWidth="1.2"
                />
                <rect
                  x="9"
                  y="2"
                  width="5"
                  height="5"
                  rx="0.5"
                  stroke="#3B3F6E"
                  strokeWidth="1.2"
                />
                <rect
                  x="2"
                  y="9"
                  width="5"
                  height="5"
                  rx="0.5"
                  stroke="#3B3F6E"
                  strokeWidth="1.2"
                />
                <rect
                  x="9"
                  y="9"
                  width="5"
                  height="5"
                  rx="0.5"
                  stroke="#3B3F6E"
                  strokeWidth="1.2"
                />
              </svg>
              Show QR
            </button>
          </div>
          <p className="text-[12px] text-graphite-60">
            Use this to log in or connect with a teacher.
          </p>
        </div>
        {/* Connect illustration */}
        <div className="w-[200px] h-[160px] flex items-center justify-center shrink-0 ml-6">
          <svg
            width="200"
            height="160"
            viewBox="0 0 200 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 80C20 35.8172 55.8172 0 100 0C144.183 0 180 35.8172 180 80C180 124.183 144.183 160 100 160C55.8172 160 20 124.183 20 80Z"
              fill="#3B3F6E"
              fillOpacity="0.05"
            />
            <path
              d="M40 80C40 46.8629 66.8629 20 100 20C133.137 20 160 46.8629 160 80C160 113.137 133.137 140 100 140C66.8629 140 40 113.137 40 80Z"
              fill="#3B3F6E"
              fillOpacity="0.1"
            />
            <g filter="url(#connect-card-shadow)">
              <path
                d="M55.6088 43.1584C56.5325 34.3703 64.4055 27.9949 73.1936 28.9185L136.843 35.6083C145.631 36.532 152.007 44.405 151.083 53.1931L144.393 116.843C143.469 125.631 135.596 132.006 126.808 131.082L63.1589 124.393C54.3708 123.469 47.9953 115.596 48.919 106.808L55.6088 43.1584Z"
                fill="#FCFCFC"
                shapeRendering="crispEdges"
              />
              <path
                d="M73.1413 29.4158L136.791 36.1056C145.304 37.0004 151.48 44.6274 150.586 53.1409L143.896 116.79C143.001 125.304 135.374 131.48 126.861 130.585L63.2112 123.895C54.6977 123.001 48.5215 115.374 49.4163 106.86L56.1061 43.2107C57.0009 34.6972 64.6278 28.521 73.1413 29.4158Z"
                stroke="#2B2B2F"
                strokeOpacity="0.05"
                shapeRendering="crispEdges"
              />
              <g clipPath="url(#connect-clip-a)">
                <g clipPath="url(#connect-clip-b)">
                  <path
                    d="M112.638 60.2162L91.7527 58.0212C89.281 57.7614 87.0667 59.5545 86.807 62.0261L83.3575 94.8454C83.0978 97.317 84.8908 99.5313 87.3625 99.7911L108.247 101.986C110.719 102.246 112.933 100.453 113.193 97.9812L116.643 65.162C116.902 62.6903 115.109 60.476 112.638 60.2162Z"
                    stroke="#3B3F6E"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M97.25 63.1211L106.201 64.0618"
                    stroke="#3B3F6E"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M106.946 83.4195C106.634 83.0077 106.239 82.6655 105.787 82.415C105.334 82.1644 104.835 82.0109 104.32 81.9642C103.239 81.8506 102.217 82.1589 101.444 82.8337C100.671 83.5084 100.213 84.5066 100.176 85.6227C100.106 87.8286 101.587 89.7838 103.477 89.9826C105.368 90.1813 107.221 88.5764 107.612 86.4061C107.809 85.3164 107.572 84.2554 106.946 83.4195ZM108.907 99.0372L96.2843 97.7105C96.1197 97.6959 95.9603 97.6453 95.8174 97.5623C95.6745 97.4794 95.5515 97.3661 95.4571 97.2305C95.3553 97.0787 95.2889 96.9059 95.2629 96.725C95.2368 96.5441 95.2519 96.3596 95.3068 96.1853C95.7819 94.5799 96.8709 93.3039 98.4566 92.495C99.8651 91.7767 101.585 91.4805 103.301 91.6608C105.017 91.8411 106.638 92.4885 107.866 93.4839C109.249 94.6049 110.049 96.0794 110.18 97.7485C110.197 97.9305 110.174 98.114 110.111 98.2856C110.048 98.4571 109.947 98.6123 109.816 98.7396C109.695 98.8527 109.551 98.9379 109.394 98.9893C109.237 99.0407 109.071 99.0571 108.907 99.0372Z"
                    fill="#3B3F6E"
                  />
                </g>
              </g>
              <path
                d="M119.89 82.0914C120.121 79.8943 122.09 78.3005 124.287 78.5314C126.484 78.7623 128.078 80.7306 127.847 82.9276C127.616 85.1246 125.647 86.7185 123.45 86.4876C121.253 86.2567 119.66 84.2884 119.89 82.0914Z"
                fill="#9A9CCB"
              />
            </g>
            <defs>
              <filter
                id="connect-card-shadow"
                x="45.2461"
                y="26.2461"
                width="109.508"
                height="109.508"
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
              >
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix
                  in="SourceAlpha"
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                  result="hardAlpha"
                />
                <feOffset dy="1" />
                <feGaussianBlur stdDeviation="1" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix
                  type="matrix"
                  values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                />
                <feBlend
                  mode="normal"
                  in2="BackgroundImageFix"
                  result="effect1_dropShadow"
                />
                <feBlend
                  mode="normal"
                  in="SourceGraphic"
                  in2="effect1_dropShadow"
                  result="shape"
                />
              </filter>
              <clipPath id="connect-clip-a">
                <rect
                  width="48"
                  height="48"
                  fill="white"
                  transform="translate(78.6406 53.625) rotate(5.99997)"
                />
              </clipPath>
              <clipPath id="connect-clip-b">
                <rect
                  width="48"
                  height="48"
                  fill="white"
                  transform="translate(78.6406 53.625) rotate(5.99997)"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>

      {/* Add your teacher */}
      <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-5">
        Add your teacher
      </h3>

      {/* Scan QR Code */}
      <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-[#EEECEA] rounded-xl flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect
              x="2"
              y="2"
              width="7"
              height="7"
              rx="1"
              stroke="#3B3F6E"
              strokeWidth="1.3"
            />
            <rect
              x="13"
              y="2"
              width="7"
              height="7"
              rx="1"
              stroke="#3B3F6E"
              strokeWidth="1.3"
            />
            <rect
              x="2"
              y="13"
              width="7"
              height="7"
              rx="1"
              stroke="#3B3F6E"
              strokeWidth="1.3"
            />
            <rect
              x="14"
              y="14"
              width="5"
              height="5"
              rx="0.5"
              stroke="#3B3F6E"
              strokeWidth="1"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-[#2B2B2F]">
            Scan QR Code
          </h4>
          <p className="text-[12px] text-graphite-60">
            Use your camera to connect
          </p>
        </div>
        <button className="px-5 py-[9px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[13px] font-semibold transition-colors cursor-pointer">
          Open Scanner
        </button>
      </div>

      {/* Enter Class Code */}
      <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-5 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#EEECEA] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-[13px] font-bold text-[#3B3F6E]">ABC</span>
          </div>
          <div className="flex-1">
            <h4 className="text-[14px] font-semibold text-[#2B2B2F] mb-2">
              Enter Class Code
            </h4>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="e.g., NEVO-CLASS-204"
                className="flex-1 px-4 py-[8px] bg-[#F7F1E6] border border-[#E9E7E2] rounded-lg text-[13px] text-[#2B2B2F] placeholder:text-graphite-40 outline-none focus:border-[#3B3F6E] transition-colors"
              />
              <button className="flex items-center gap-1 px-5 py-[8px] border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer shrink-0">
                Connect
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pending and Connected */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending */}
        <div>
          <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">Pending</h4>
          <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 flex flex-col items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="mb-3 opacity-40"
            >
              <rect
                x="4"
                y="8"
                width="24"
                height="16"
                rx="3"
                stroke="#8A8D9F"
                strokeWidth="1.5"
              />
              <path
                d="M4 11L16 19L28 11"
                stroke="#8A8D9F"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[13px] text-graphite-40 font-medium">
              No requests yet.
            </p>
          </div>
        </div>

        {/* Connected */}
        <div>
          <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">
            Connected
          </h4>
          {profile?.connections?.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
              {profile.connections.map((conn: any) => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EDE7] last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8D5C4] flex items-center justify-center text-[12px] font-bold text-[#5C4A32] shrink-0">
                    {conn.teacher_name
                      ? conn.teacher_name.substring(0, 2).toUpperCase()
                      : "T"}
                  </div>
                  <div>
                    <p className="text-[13.5px] font-semibold text-[#2B2B2F]">
                      {conn.teacher_name || "Teacher"}
                    </p>
                    <p className="text-[11.5px] text-graphite-40">
                      {conn.subject || "Subject"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 flex flex-col items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                className="mb-3 opacity-40"
              >
                <rect
                  x="4"
                  y="8"
                  width="24"
                  height="16"
                  rx="3"
                  stroke="#8A8D9F"
                  strokeWidth="1.5"
                />
                <path
                  d="M4 11L16 19L28 11"
                  stroke="#8A8D9F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-[13px] text-graphite-40 font-medium">
                No connected teachers yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PreferenceCategory {
  key: string;
  label: string;
  options: string[];
  selected: string[];
}

const defaultPreferences: PreferenceCategory[] = [
  {
    key: "learningPreference",
    label: "Learning Preference",
    options: [
      "Watching and looking",
      "Listening to explanations",
      "Doing with hands",
      "Reading on my own",
    ],
    selected: ["Watching and looking"],
  },
  {
    key: "whatHelps",
    label: "What Helps You Understand",
    options: [
      "Pictures and diagrams",
      "Step-by-step instructions",
      "Examples and stories",
      "Trying it myself",
    ],
    selected: ["Pictures and diagrams"],
  },
  {
    key: "focusDuration",
    label: "Focus Duration",
    options: [
      "About 5 minutes",
      "About 10 minutes",
      "About 15 minutes or more",
    ],
    selected: ["About 10 minutes"],
  },
  {
    key: "whenHard",
    label: "When Something Feels Hard",
    options: ["Take a break", "Keep trying", "Ask for help"],
    selected: ["Ask for help"],
  },
  {
    key: "motivation",
    label: "Motivation",
    options: ["Encouragement", "Rewards", "Switch activities"],
    selected: ["Encouragement"],
  },
  {
    key: "challengeLevel",
    label: "Challenge Level",
    options: [
      "Easy and straightforward",
      "A little challenging",
      "Really hard",
    ],
    selected: ["A little challenging"],
  },
  {
    key: "learningEnvironment",
    label: "Learning Environment",
    options: ["Quiet and calm", "Visual and colorful", "Moving and touching"],
    selected: ["Quiet and calm"],
  },
];

// ─── Profile View ──────────────────────────────────────────────────────────────
function StudentProfileView({
  user,
  profile,
  onLogout,
}: {
  user?: any;
  profile?: any;
  onLogout: () => Promise<void>;
}) {
  const guardAuth = useAuthGuard("student");
  const [settings, setSettings] = useState({
    adaptAutomatically: true,
    cameraForLearningSignals: false,
    voiceGuidance: true,
    notifications: false,
  });
  const [showLogout, setShowLogout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  // Provide fallbacks if backend doesn't have it
  const displayName = user?.name || profile?.first_name || profile?.name || "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";
  const schoolObj = profile?.school || user?.school || {};
  const classObj = profile?.class || user?.class || {};
  const schoolName =
    schoolObj.school_name ||
    schoolObj.name ||
    profile?.school_name ||
    user?.school_name ||
    "Greenfield Academy";
  const gradeLevel =
    classObj.class_name ||
    classObj.name ||
    profile?.class_name ||
    profile?.grade_level ||
    user?.class_name ||
    "JSS 2";
  const nevoId =
    profile?.nevo_id || profile?.student_id || user?.nevoId || "NEVO-XXXX";
  const learningProfile = profile?.learning_profile || profile || null;

  // Convert backend learning_profile to UI mapping
  const learningStyle =
    learningProfile?.learning_modality ||
    learningProfile?.learningStyle ||
    "Visual";
  const focusTime = learningProfile?.focus_duration
    ? `${learningProfile.focus_duration} min`
    : learningProfile?.focusTime || "15 mins";
  const challengeLevel =
    learningProfile?.challenge_pref ||
    learningProfile?.challengeLevel ||
    "Moderate";

  const handleCopyId = () => {
    navigator.clipboard?.writeText(nevoId).catch(() => {});
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      const res = await updateStudentSettings({ [key]: newValue });
      if (guardAuth(res as any)) return;
      if (res?.error) {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error("Failed to update setting", err);
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
    }
  };

  if (showPreferences) {
    return <EditPreferencesView onBack={() => setShowPreferences(false)} />;
  }

  return (
    <div className="max-w-[820px]">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-[56px] h-[56px] rounded-full bg-[#3B3F6E] flex items-center justify-center text-white text-[18px] font-bold shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-[20px] font-bold text-[#2B2B2F]">
            {displayName}
          </h1>
          <p className="text-[13px] text-graphite-60">
            {schoolName} · {gradeLevel}
          </p>
          <button className="text-[12px] text-[#3B3F6E] font-semibold hover:text-[#2C2F52] transition-colors cursor-pointer mt-0.5">
            Edit profile
          </button>
        </div>
      </div>

      {/* How You Learn */}
      <section className="mb-8">
        <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">
          How You Learn
        </h3>
        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE7]">
            <span className="text-[14px] text-[#2B2B2F] font-medium">
              Learning style
            </span>
            <span className="flex items-center gap-2 text-[14px] font-semibold text-[#3B3F6E]">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  stroke="#3B3F6E"
                  strokeWidth="1.4"
                />
                <circle cx="9" cy="9" r="3" fill="#3B3F6E" />
              </svg>
              {learningStyle}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EDE7]">
            <span className="text-[14px] text-[#2B2B2F] font-medium">
              Focus time
            </span>
            <span className="text-[14px] font-semibold text-[#3B3F6E]">
              {focusTime}
            </span>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-[14px] text-[#2B2B2F] font-medium">
              Challenge level
            </span>
            <span className="text-[14px] font-semibold text-[#3B3F6E]">
              {challengeLevel}
            </span>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="text-[12px] text-[#3B3F6E] font-semibold hover:text-[#2C2F52] transition-colors cursor-pointer"
          >
            Edit preferences
          </button>
        </div>
      </section>

      {/* Settings */}
      <section className="mb-8">
        <h3 className="text-[12px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-4">
          Settings
        </h3>
        <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
          {[
            {
              key: "adaptAutomatically" as const,
              label: "Adapt automatically",
            },
            {
              key: "cameraForLearningSignals" as const,
              label: "Camera for learning signals",
            },
            { key: "voiceGuidance" as const, label: "Voice guidance" },
            { key: "notifications" as const, label: "Notifications" },
          ].map((item, i, arr) => (
            <div
              key={item.key}
              className={`flex items-center justify-between px-6 py-4 ${i < arr.length - 1 ? "border-b border-[#F0EDE7]" : ""}`}
            >
              <span className="text-[14px] text-[#2B2B2F] font-medium">
                {item.label}
              </span>
              <button
                onClick={() => toggleSetting(item.key)}
                className={`w-[44px] h-[24px] rounded-full transition-colors duration-200 cursor-pointer relative ${
                  settings[item.key] ? "bg-[#3B3F6E]" : "bg-[#D5D3CE]"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    settings[item.key]
                      ? "translate-x-[22px]"
                      : "translate-x-[2px]"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Unique ID */}
      <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-4 flex items-center justify-between mb-6">
        <span className="text-[14px] text-[#2B2B2F] font-medium">
          Unique ID
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[#3B3F6E]">
            {nevoId}
          </span>
          <button
            onClick={handleCopyId}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F3F0EA] transition-colors cursor-pointer"
            title={idCopied ? "Copied!" : "Copy ID"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect
                x="5"
                y="5"
                width="9"
                height="9"
                rx="1.5"
                stroke="#3B3F6E"
                strokeWidth="1.3"
              />
              <path
                d="M3 11V3C3 2.44772 3.44772 2 4 2H12"
                stroke="#3B3F6E"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Log out */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowLogout(true)}
          className="text-[14px] font-semibold text-[#C0392B] hover:text-[#A93226] transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>

      {/* Logout confirmation modal */}
      {showLogout && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowLogout(false)}
          />
          <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
            <div className="bg-[#FDF8F0] rounded-b-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-1">
                Log out of Nevo?
              </h3>
              <p className="text-[14px] text-graphite-60 mb-6">
                Make sure you&apos;ve saved your Nevo ID.
              </p>
              <button
                onClick={onLogout}
                className="w-full py-[13px] bg-transparent border-2 border-[#E8B4B4] text-[#C0392B] rounded-full text-[14px] font-semibold hover:bg-[#FEF5F5] transition-colors cursor-pointer mb-3"
              >
                Log out
              </button>
              <button
                onClick={() => setShowLogout(false)}
                className="w-full py-[10px] text-[14px] font-semibold text-graphite-60 hover:text-[#2B2B2F] transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Edit Preferences View ─────────────────────────────────────────────────────
function EditPreferencesView({ onBack }: { onBack: () => void }) {
  const [preferences, setPreferences] = useState<PreferenceCategory[]>(
    defaultPreferences.map((p) => ({ ...p, selected: [...p.selected] })),
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleOption = (categoryKey: string, option: string) => {
    setPreferences((prev) =>
      prev.map((cat) => {
        if (cat.key !== categoryKey) return cat;
        const isSelected = cat.selected.includes(option);
        return {
          ...cat,
          selected: isSelected
            ? cat.selected.filter((s) => s !== option)
            : [...cat.selected, option],
        };
      }),
    );
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowSaveModal(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="max-w-[820px]">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 mb-6 cursor-pointer group"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18L9 12L15 6"
            stroke="#3B3F6E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Title */}
      <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">
        Your learning style
      </h2>

      {/* Preference categories */}
      <div className="flex flex-col gap-7">
        {preferences.map((cat) => (
          <div key={cat.key}>
            <h4 className="text-[11px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-3">
              {cat.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {cat.options.map((option) => {
                const isActive = cat.selected.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(cat.key, option)}
                    className={`px-4 py-[8px] rounded-full text-[13px] font-medium border-2 transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#3B3F6E] text-white border-[#3B3F6E]"
                        : "bg-white text-[#2B2B2F] border-[#E9E7E2] hover:border-[#3B3F6E]"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <button className="w-full mt-8 py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer">
        Save preferences
      </button>
      <p className="text-[12px] text-graphite-40 text-center mt-3">
        Saving your preferences won&apos;t affect lessons already in progress.
      </p>

      {/* Save changes modal */}
      {showSaveModal && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="bg-white rounded-t-3xl px-8 py-6 max-w-[600px] mx-auto shadow-[0_-8px_32px_rgba(0,0,0,0.12)]">
              <div className="flex justify-center mb-5">
                <div className="w-10 h-1 rounded-full bg-[#D5D3CE]" />
              </div>
              <h3 className="text-[18px] font-bold text-[#2B2B2F] mb-5 text-center">
                Save your changes?
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    onBack();
                  }}
                  className="flex-1 py-[13px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    onBack();
                  }}
                  className="flex-1 py-[13px] bg-transparent border-2 border-[#E9E7E2] text-[#3B3F6E] rounded-full text-[14px] font-semibold hover:bg-[#F3F0EA] transition-colors cursor-pointer"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
