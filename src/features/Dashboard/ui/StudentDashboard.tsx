"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StudentSidebar } from "@/widgets/StudentSidebar";
import {
  getStudentDashboard,
  getStudentLessons,
  getStudentProfile,
  getStudentProgressOverview,
  getStudentConnections,
  getStudentDownloads,
  getStudentSchoolById,
  getStudentSchoolClasses,
  getStudentSettings,
  getLessonDownloadPackage,
  recordStudentDownload,
  removeStudentDownload,
  updateStudentLearningProfile,
  updateStudentSettings,
} from "../api/student";
import { normalizeLearningMode, useRegistrationStore } from "@/shared/store/useRegistrationStore";
import { signOut } from "next-auth/react";
import { clearClientSessionState, getDashboardPath, useApiTokenExpiryRedirect, useAuthGuard } from "@/shared/lib";
import { toast } from "@/shared/ui";
import { getLessonArtwork } from "../lib/lessonArtwork";
import {
  getStoredOfflineLessonPackage,
  listStoredOfflineLessonPackages,
  prepareOfflineLessonPackage,
  removeOfflineLessonPackage,
  saveOfflineLessonPackage,
  type OfflineLessonPackage,
} from "../lib/offlineLessons";
import dynamic from "next/dynamic";

const StudentProgressPanel = dynamic(
  () =>
    import("./StudentProgressPanel").then((mod) => mod.StudentProgressPanel),
  {
    loading: () => (
      <div className="flex min-h-[30vh] items-center justify-center text-[14px] text-graphite-60">
        Loading progress...
      </div>
    ),
  },
);

const QRInner = dynamic(
  () =>
    import("react-qr-code").then((m) => {
      // Render wrapper component
      return function QRWrap({ value }: { value: string }) {
        // eslint-disable-next-line react/jsx-no-undef
        return <m.default value={value} />;
      };
    }),
  { ssr: false },
);

const ScannerInner = dynamic(
  async () => {
    const mod = await import("@zxing/browser");
    return function Scanner({
      onDetected,
    }: {
      onDetected: (text: string) => void;
    }) {
      const ref = React.useRef<HTMLVideoElement | null>(null);
      React.useEffect(() => {
        let codeReader: any = null;
        (async () => {
          try {
            const { BrowserMultiFormatReader } = mod;
            codeReader = new BrowserMultiFormatReader();
            const videoElem = document.createElement("video");
            ref.current = videoElem;
            const previewElem = document.getElementById("zxing-preview");
            if (previewElem) {
              previewElem.innerHTML = "";
              previewElem.appendChild(videoElem);
            }
            const hints = new Map();
            await codeReader.decodeFromVideoDevice(
              undefined,
              videoElem,
              (result: any, err: any) => {
                if (result && result.getText) {
                  onDetected(result.getText());
                }
              },
            );
          } catch (e) {
            // ignore
          }
        })();
        return () => {
          try {
            if (codeReader && codeReader.reset) codeReader.reset();
          } catch {}
        };
      }, [onDetected]);

      return <div id="zxing-preview" className="w-full h-full" />;
    };
  },
  { ssr: false },
);
// ─── Types ─────────────────────────────────────────────────────────────────────
export type Lesson = {
  id: number | string;
  lessonId: string;
  title: string;
  subject: string;
  topic: string;
  grade: string;
  duration: string;
  status: "completed" | "in_progress" | "not_started";
  objectives?: string[];
  bannerColor?: string;
  image_url?: string;
  media_url?: string;
  imageUrl?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  cover_image?: string;
  coverImage?: string;
  banner_image_url?: string;
  bannerImageUrl?: string;
  stepProgress?: {
    currentStep: number;
    totalSteps: number;
    progressPercentage: number;
  };
};

type StudentSettingsState = {
  adaptAutomatically: boolean;
  cameraForLearningSignals: boolean;
  voiceGuidance: boolean;
  notifications: boolean;
};

const defaultStudentSettings: StudentSettingsState = {
  adaptAutomatically: true,
  cameraForLearningSignals: false,
  voiceGuidance: true,
  notifications: false,
};

function normalizeStudentSettings(data: any): StudentSettingsState {
  return {
    adaptAutomatically: Boolean(
      data?.adapt_automatically ?? data?.adaptAutomatically ?? true,
    ),
    cameraForLearningSignals: Boolean(
      data?.camera_for_learning_signals ??
        data?.cameraForLearningSignals ??
        false,
    ),
    voiceGuidance: Boolean(
      data?.voice_guidance ?? data?.voiceGuidance ?? true,
    ),
    notifications: Boolean(data?.notifications ?? false),
  };
}

function formatStorageSize(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return "0 MB";
  const mb = sizeBytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  const kb = sizeBytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

function getStudentDisplayId(profile: any, user?: any) {
  return (
    profile?.nevo_id ||
    profile?.student_id ||
    profile?.studentId ||
    user?.nevoId ||
    user?.student_id ||
    null
  );
}

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

function getLessonVisualUrl(lesson: Lesson) {
  return getLessonArtwork(lesson);
}

function normalizeProgress(lesson: Lesson | null) {
  const stepProgress = lesson?.stepProgress;
  if (!stepProgress) {
    return {
      currentStep: lesson?.status === "in_progress" ? 2 : 1,
      totalSteps: 5,
      progressPercentage: lesson?.status === "in_progress" ? 40 : 0,
    };
  }

  const totalSteps = Math.max(1, stepProgress.totalSteps || 5);
  const currentStep = Math.max(1, stepProgress.currentStep || 1);
  const rawPercentage =
    stepProgress.progressPercentage != null
      ? Number(stepProgress.progressPercentage || 0)
      : Math.round((currentStep / totalSteps) * 100);
  const progressPercentage =
    totalSteps > 0 && currentStep >= totalSteps
      ? 100
      : Math.max(0, Math.min(100, rawPercentage));

  return {
    currentStep,
    totalSteps,
    progressPercentage,
  };
}

function getLessonActionLabel(lesson: Lesson | null) {
  if (!lesson) return "Open Lesson";
  if (lesson.status === "completed") return "Review Lesson";
  if (lesson.status === "in_progress") return "Continue Lesson";
  return "Start Lesson";
}

function getLessonResumePath(lesson: Lesson) {
  const lessonPath = `/lesson/${lesson.lessonId || lesson.id}`;
  if (lesson.status !== "in_progress") return lessonPath;

  const progress = normalizeProgress(lesson);
  return `${lessonPath}/step-${Math.max(1, progress.currentStep)}`;
}

function getLessonPickupLabel(
  lesson: Lesson | null,
  progress: ReturnType<typeof normalizeProgress>,
) {
  if (!lesson) return "Ready when you are";
  if (lesson.status === "in_progress") {
    return `Pick up from Step ${progress.currentStep}`;
  }
  if (lesson.status === "completed") {
    return "Revisit what you learned";
  }
  return "Start from Step 1";
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function StudentDashboard({
  view = "home",
  user,
}: {
  view?: string;
  user?: any;
}) {
  const router = useRouter();
  useApiTokenExpiryRedirect("student");
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
  const setLearningMode = useRegistrationStore((state) => state.setLearningMode);
  const userIdentity =
    user?.id || user?.nevoId || user?.email || user?.name || null;
  const needsLessonData = view === "home" || view === "lessons";
  const needsProfileData = view === "connect" || view === "profile";
  const needsProgressData = view === "progress";

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
      try {
        const requests: Promise<any>[] = [];
        const requestKeys: Array<"dashboard" | "lessons" | "profile" | "progress"> = [];

        if (needsLessonData) {
          requests.push(getStudentDashboard());
          requestKeys.push("dashboard");
          requests.push(getStudentLessons());
          requestKeys.push("lessons");
        }

        if (needsProfileData) {
          requests.push(getStudentProfile());
          requestKeys.push("profile");
        }

        if (needsProgressData) {
          requests.push(getStudentProgressOverview());
          requestKeys.push("progress");
        }

        if (requests.length === 0) {
          setLoading(false);
          return;
        }

        const responses = await Promise.all(requests);

        if (guardAuth(responses as any)) {
          return;
        }

        const responseMap = requestKeys.reduce<Record<string, any>>((acc, key, index) => {
          acc[key] = responses[index];
          return acc;
        }, {});

        const dashRes = responseMap.dashboard;
        const lessRes = responseMap.lessons;
        const profRes = responseMap.profile;
        const progRes = responseMap.progress;

        if (profRes?.data) {
          setProfile(profRes.data);
          const backendMode =
            profRes.data?.learning_preference ||
            profRes.data?.learning_style ||
            profRes.data?.learning_profile?.learning_preference ||
            profRes.data?.learning_profile?.learning_style ||
            profRes.data?.how_you_learn?.learning_style ||
            null;
          setLearningMode(normalizeLearningMode(backendMode));
        } else if (!needsProfileData && view !== "home") {
          setProfile((prev: any) => prev);
        }

        if (progRes?.data) {
          setProgressData(progRes.data);
        }

        if (!needsLessonData) {
          setLoading(false);
          return;
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
          const canonicalLessonId = String(
            item?.lesson_id ||
              item?.lessonId ||
              item?.id ||
              `${item?.title || "lesson"}-${estimatedMinutes}`,
          );
          const currentStep = Number(
            item?.current_step ?? item?.currentStep ?? 0,
          );
          const totalSteps = Number(item?.total_steps ?? item?.totalSteps ?? 0);
          const progressPercentage = Number(
            item?.progress_percentage ?? item?.progressPercentage ?? 0,
          );
          const hasReachedFinalStep =
            totalSteps > 0 && currentStep >= totalSteps;
          const inferredStatus =
            item?.status ||
            (hasReachedFinalStep || progressPercentage >= 100
              ? "completed"
              : currentStep > 0 || progressPercentage > 0
                ? "in_progress"
                : "not_started");

          return {
            id: canonicalLessonId,
            lessonId: canonicalLessonId,
            title: item?.title || "Lesson",
            subject: item?.subject || "Subject",
            topic: item?.topic || "Topic",
            grade: item?.grade || `~${estimatedMinutes} min`,
            duration: `${estimatedMinutes} min`,
            status: inferredStatus,
            objectives: item?.objectives || [],
            image_url: item?.image_url,
            media_url: item?.media_url,
            imageUrl: item?.imageUrl,
            thumbnail_url: item?.thumbnail_url,
            thumbnailUrl: item?.thumbnailUrl,
            cover_image: item?.cover_image,
            coverImage: item?.coverImage,
            banner_image_url: item?.banner_image_url,
            bannerImageUrl: item?.bannerImageUrl,
            stepProgress:
              item?.progress_percentage != null ||
              item?.current_step != null ||
              item?.total_steps != null
                ? {
                    currentStep,
                    totalSteps,
                    progressPercentage,
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
        const reconciledLessons = applyBackendCompletedLessonOverrides(
          currentLessonSource ? toLessonCard(currentLessonSource) : null,
          mappedAssigned,
          mappedCompleted,
        );

        setStudentName(rawDashboard.student_name || user?.name || "Student");
        setCurrentLesson(reconciledLessons.currentLesson);
        setAssignedLessons(reconciledLessons.assignedLessons);
        setTeacherLessons(reconciledLessons.assignedLessons);
        setCompletedLessons(reconciledLessons.completedLessons);
        setRecommendedLessons(mappedRecommended);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [
    userIdentity,
    clearRegistration,
    setLearningMode,
    guardAuth,
    needsLessonData,
    needsProfileData,
    needsProgressData,
    view,
  ]);

  const handleStudentLogout = async () => {
    await clearClientSessionState();
    await signOut({ callbackUrl: "/login/student" });
  };

  return (
    <>
      <div className="flex min-h-screen w-full bg-[#F7F1E6] font-sans">
        <StudentSidebar currentView={view} />
        <main
          className={`relative ml-[220px] flex min-h-screen flex-1 ${
            selectedLesson
              ? "px-0 py-0"
              : "px-4 py-5 sm:px-6 sm:py-6 lg:px-[44px] lg:py-[32px]"
          }`}
        >
          {selectedLesson ? (
            <LessonDetailView
              lesson={selectedLesson}
              onBack={() => setSelectedLesson(null)}
            />
          ) : view === "lessons" ? (
            <div className="w-full">
              <StudentLessonsView
                onSelectLesson={setSelectedLesson}
                currentLesson={currentLesson}
                teacherLessons={teacherLessons}
                completedLessons={completedLessons}
                loading={loading}
              />
            </div>
          ) : view === "downloads" ? (
            <div className="h-full min-h-0 w-full flex-1 overflow-hidden">
              <StudentDownloadsView />
            </div>
          ) : view === "progress" ? (
            <div className="w-full">
              <StudentProgressPanel progressData={progressData} />
            </div>
          ) : view === "connect" ? (
            <div className="w-full">
              <StudentConnectView profile={profile} loading={loading} />
            </div>
          ) : view === "profile" ? (
            <div className="w-full">
              <StudentProfileView
                user={user}
                profile={profile}
                onLogout={handleStudentLogout}
                loading={loading}
              />
            </div>
          ) : (
            <div className="w-full">
              <StudentHomeView
                onSelectLesson={setSelectedLesson}
                user={user}
                studentName={studentName}
                assignedLessons={assignedLessons}
                recommendedLessons={recommendedLessons}
                currentLesson={currentLesson}
                loading={loading}
              />
            </div>
          )}
        </main>
      </div>
    </>
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
  loading,
}: {
  onSelectLesson: (lesson: Lesson) => void;
  user?: any;
  studentName?: string;
  assignedLessons: Lesson[];
  recommendedLessons: Lesson[];
  currentLesson: Lesson | null;
  loading: boolean;
}) {
  const firstName =
    (studentName || user?.name || "Student").split(" ")[0] || "Student";
  const featuredLesson = isLessonEffectivelyCompleted(currentLesson)
    ? assignedLessons[0] || null
    : currentLesson || assignedLessons[0] || null;
  const progress = normalizeProgress(featuredLesson);
  const assignedCards = featuredLesson
    ? assignedLessons.filter((lesson) => lesson.id !== featuredLesson.id)
    : assignedLessons;
  const topicImageUrl = featuredLesson ? getLessonVisualUrl(featuredLesson) : null;

  if (loading) {
    return <StudentHomeSkeleton />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[716px] flex-col gap-10 lg:max-w-[720px]">
      <div>
        <h1 className="text-[36px] font-bold leading-[1.15] text-[#2B2B2F] sm:text-[40px]">
          Hi, {firstName}.
        </h1>
        <p className="mt-1 text-[16px] font-medium leading-[1.5] text-[#2B2B2F]/80 sm:text-[18px]">
          Ready to continue where you left off?
        </p>
      </div>

      {featuredLesson ? (
        <div
          className="flex w-full cursor-pointer flex-col gap-6 rounded-[24px] border border-black/5 bg-[#FAF9F6] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] sm:p-[33px]"
          onClick={() => onSelectLesson(featuredLesson)}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.3px] text-[#3B3F6E]">
              {featuredLesson.subject} · {featuredLesson.topic}
            </span>
            <h2 className="text-[28px] font-bold leading-[1.2] text-[#2B2B2F] sm:text-[32px]">
              {featuredLesson.title}
            </h2>
          </div>

          <div
            className="relative h-[132px] w-full overflow-hidden rounded-[16px] border border-black/5 bg-[#F7F1E6] sm:h-[120px]"
            style={
              topicImageUrl
                ? {
                    backgroundImage: `url("${topicImageUrl}")`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,#F7F1E6_0%,rgba(247,241,230,0.92)_42%,rgba(247,241,230,0.18)_100%)]" />
            <div className="absolute inset-0 flex items-center px-5 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FCFCFC] shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#3B3F6E]">
                    <div className="ml-1 h-0 w-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-[#FCFCFC]" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[14px] font-bold text-[#3B3F6E]">
                    Step {progress.currentStep} of {progress.totalSteps}
                  </span>
                  <div className="relative h-[6px] w-[128px] overflow-hidden rounded-full bg-black/10">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full bg-[#3B3F6E]"
                      style={{
                        width: `${Math.max(0, Math.min(100, progress.progressPercentage))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-[14px] font-medium text-black/60">
              {getLessonPickupLabel(featuredLesson, progress)}
            </span>
            <button
              className="w-full rounded-2xl bg-[#3B3F6E] px-8 py-4 text-[16px] font-semibold text-[#FCFCFC] shadow-[0_4px_6px_-1px_rgba(59,63,110,0.2),0_2px_4px_-2px_rgba(59,63,110,0.2)] transition-colors hover:bg-[#2C2F52] sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                onSelectLesson(featuredLesson);
              }}
            >
              {getLessonActionLabel(featuredLesson)}
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

      <section className="w-full">
        <h3 className="mb-4 text-[15px] font-semibold text-[#3B3F6E]">
          Assigned
        </h3>
        {(assignedCards.length > 0 || (!currentLesson && assignedLessons.length > 0)) ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(assignedCards.length > 0 ? assignedCards : assignedLessons)
              .slice(0, 4)
              .map((lesson) => (
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

      <section className="w-full pb-12">
        <h3 className="mb-4 text-[15px] font-semibold text-[#3B3F6E]">
          Recommended for you
        </h3>
        {recommendedLessons.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommendedLessons.slice(0, 4).map((lesson) => (
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
            <button className="mt-1 cursor-pointer rounded-xl border border-[#3B3F6E] px-6 py-[6px] text-[14px] font-medium text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E] hover:text-[#FCFCFC]">
              Browse all lessons
            </button>
          </DashboardEmptyState>
        )}
      </section>
    </div>
  );
}

function computeOfflineVersionHash(contentBlocks: unknown[]) {
  const raw = JSON.stringify(contentBlocks ?? []);
  let hash = 0;
  for (let index = 0; index < raw.length; index += 1) {
    hash = (hash * 31 + raw.charCodeAt(index)) >>> 0;
  }
  return `local-${hash.toString(16)}`;
}

function extractOfflineMediaUrls(value: unknown): string[] {
  const urls = new Set<string>();

  function visit(entry: unknown) {
    if (!entry) return;

    if (typeof entry === "string") {
      if (/^https?:\/\//i.test(entry) || entry.startsWith("data:")) {
        urls.add(entry);
      }
      return;
    }

    if (Array.isArray(entry)) {
      entry.forEach(visit);
      return;
    }

    if (typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      ["image_url", "media_url", "url", "ai_generated_url"].forEach((key) => {
        const candidate = record[key];
        if (typeof candidate === "string" && candidate) {
          urls.add(candidate);
        }
      });
      Object.values(record).forEach(visit);
    }
  }

  visit(value);
  return Array.from(urls);
}

function getUniqueLessonIdCandidates(...values: Array<unknown>) {
  return Array.from(
    new Set(
      values
        .map((value) =>
          typeof value === "string" || typeof value === "number"
            ? String(value).trim()
            : "",
        )
        .filter(Boolean),
    ),
  );
}

function applyBackendCompletedLessonOverrides(
  currentLesson: Lesson | null,
  assignedLessons: Lesson[],
  completedLessons: Lesson[],
) {
  const completedIds = new Set(
    completedLessons.flatMap((lesson) =>
      getUniqueLessonIdCandidates(lesson.id, lesson.lessonId),
    ),
  );

  const completedCurrentLesson =
    currentLesson && isLessonEffectivelyCompleted(currentLesson)
      ? ({ ...currentLesson, status: "completed" } as Lesson)
      : null;

  if (completedCurrentLesson) {
    getUniqueLessonIdCandidates(
      completedCurrentLesson.id,
      completedCurrentLesson.lessonId,
    ).forEach((id) => completedIds.add(id));
  }

  const visibleCompletedLessons = [...completedLessons];
  if (completedCurrentLesson) {
    const alreadyPresent = visibleCompletedLessons.some((lesson) =>
      getUniqueLessonIdCandidates(lesson.id, lesson.lessonId).some((id) =>
        completedIds.has(id) &&
        getUniqueLessonIdCandidates(
          completedCurrentLesson.id,
          completedCurrentLesson.lessonId,
        ).includes(id),
      ),
    );
    if (!alreadyPresent) {
      visibleCompletedLessons.unshift(completedCurrentLesson);
    }
  }

  const visibleAssignedLessons = assignedLessons.filter(
    (lesson) =>
      !getUniqueLessonIdCandidates(lesson.id, lesson.lessonId).some((id) =>
        completedIds.has(id),
      ),
  );

  const visibleCurrentLesson =
    currentLesson &&
    !getUniqueLessonIdCandidates(currentLesson.id, currentLesson.lessonId).some(
      (id) => completedIds.has(id),
    )
      ? currentLesson
      : null;

  return {
    currentLesson: visibleCurrentLesson,
    assignedLessons: visibleAssignedLessons,
    completedLessons: visibleCompletedLessons,
  };
}

function isLessonEffectivelyCompleted(lesson: Lesson | null | undefined) {
  if (!lesson) return false;
  if (lesson.status === "completed") return true;

  const progress = normalizeProgress(lesson);
  return progress.totalSteps > 0 && progress.currentStep >= progress.totalSteps;
}

function StudentHomeSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-[716px] animate-pulse flex-col gap-10 lg:max-w-[720px]">
      <div>
        <div className="h-12 w-56 rounded-2xl bg-[#E8E1D5] sm:h-14 sm:w-72" />
        <div className="mt-3 h-6 w-72 rounded-xl bg-[#EEE7DB] sm:w-96" />
      </div>

      <section className="w-full rounded-[24px] border border-black/5 bg-[#FAF9F6] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-8">
        <div className="h-4 w-40 rounded-full bg-[#E4DDCF]" />
        <div className="mt-5 h-12 w-full max-w-[420px] rounded-2xl bg-[#E8E1D5]" />

        <div className="mt-6 overflow-hidden rounded-[16px] border border-black/5 bg-[#F7F1E6]">
          <div className="h-[118px] w-full bg-[linear-gradient(90deg,#ece4d7_0%,#e2d8c7_45%,#d7cbb7_100%)]" />
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-40 rounded-xl bg-[#EEE7DB]" />
          <div className="h-14 w-full rounded-[16px] bg-[#D7D0E9] sm:w-[195px]" />
        </div>
      </section>

      <section className="w-full">
        <div className="mb-4 h-6 w-24 rounded-xl bg-[#E4DDCF]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`assigned-skeleton-${index}`}
              className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6]"
            >
              <div className="h-20 w-full bg-[#E8E1D5]" />
              <div className="space-y-3 p-4">
                <div className="h-10 w-3/4 rounded-xl bg-[#EEE7DB]" />
                <div className="h-6 w-20 rounded-full bg-[#E2DAF2]" />
                <div className="h-4 w-16 rounded-lg bg-[#EEE7DB]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full pb-12">
        <div className="mb-4 h-6 w-40 rounded-xl bg-[#E4DDCF]" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`recommended-skeleton-${index}`}
              className="overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6]"
            >
              <div className="h-20 w-full bg-[#E8E1D5]" />
              <div className="space-y-3 p-4">
                <div className="h-10 w-4/5 rounded-xl bg-[#EEE7DB]" />
                <div className="h-6 w-24 rounded-full bg-[#E2DAF2]" />
                <div className="h-4 w-16 rounded-lg bg-[#EEE7DB]" />
              </div>
            </div>
          ))}
        </div>
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
  const cardImageUrl = getLessonVisualUrl(lesson);

  return (
    <div
      className="group flex h-[200px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[12px] border border-[#E0D9CE] bg-[#F7F1E6] p-[1px] box-border transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)]"
      onClick={onClick}
    >
      <div
        className="h-[80px] w-full shrink-0 rounded-t-[10px] bg-[#9A9CCB]/15"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(247,241,230,0.05) 0%, rgba(247,241,230,0.22) 100%), url("${cardImageUrl}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      />

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
  loading,
}: {
  onSelectLesson: (lesson: Lesson) => void;
  currentLesson: Lesson | null;
  teacherLessons: Lesson[];
  completedLessons: Lesson[];
  loading: boolean;
}) {
  const [completedOpen, setCompletedOpen] = useState(false);
  const featuredLesson = isLessonEffectivelyCompleted(currentLesson)
    ? teacherLessons[0] ?? null
    : currentLesson ?? teacherLessons[0] ?? null;
  const teacherLessonList = featuredLesson
    ? teacherLessons.filter((lesson) => lesson.id !== featuredLesson.id)
    : teacherLessons;
  const synthesizedCompletedCurrentLesson =
    currentLesson && isLessonEffectivelyCompleted(currentLesson)
      ? ({ ...currentLesson, status: "completed" } as Lesson)
      : null;
  const visibleCompletedLessons =
    synthesizedCompletedCurrentLesson
      ? completedLessons.some((lesson) => lesson.id === synthesizedCompletedCurrentLesson.id)
        ? completedLessons
        : [synthesizedCompletedCurrentLesson, ...completedLessons]
      : completedLessons;
  const featuredProgress = normalizeProgress(featuredLesson);
  const featuredActionLabel = getLessonActionLabel(featuredLesson);

  if (loading) {
    return <StudentLessonsSkeleton />;
  }

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
        {featuredLesson ? (
          <div
            className="w-full rounded-3xl border border-black/5 bg-[#FCFCFC] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sm:p-8"
            onClick={() => onSelectLesson(featuredLesson)}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
              <div className="flex min-h-[221px] w-full flex-col justify-between lg:w-[312px]">
                <div className="w-full">
                  <span className="text-[12px] font-bold uppercase tracking-[0.6px] text-[#3B3F6E]">
                    {featuredLesson.subject} · {featuredLesson.topic}
                  </span>
                  <h2 className="mt-4 text-[32px] font-bold leading-[35px] text-[#2B2B2F]">
                    {featuredLesson.title}
                  </h2>

                  <span className="mt-6 inline-flex items-center rounded-full bg-[#F7F1E6] px-3 py-1 text-[14px] font-medium leading-[21px] text-[#2B2B2F]/60">
                    {featuredLesson.status === "in_progress"
                      ? `Step ${featuredProgress.currentStep} in progress`
                      : featuredLesson.status === "completed"
                        ? "Completed lesson"
                        : "Ready to start"}
                  </span>
                </div>

                <button
                  className="mt-4 flex h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#3B3F6E] px-8 text-[16px] font-semibold text-white shadow-[0_4px_6px_-1px_rgba(59,63,110,0.2),0_2px_4px_-2px_rgba(59,63,110,0.2)] cursor-pointer sm:w-[190px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLesson(featuredLesson);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <path d="M3 1.5L12 7L3 12.5V1.5Z" fill="white" />
                  </svg>
                  {featuredActionLabel.replace("Lesson", "").trim()}
                </button>
              </div>

              <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-[#F7F1E6] lg:h-[180px] lg:w-[280px]">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(59,63,110,0.1)_0%,rgba(0,0,0,0)_100%)]" />
                <img
                  src={getLessonVisualUrl(featuredLesson)}
                  alt={featuredLesson.title}
                  className="h-full w-full object-cover opacity-90"
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
                  featuredProgress.progressPercentage ||
                    (featuredLesson.status === "not_started" ? 0 : 40),
                )}
                %
              </span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#3B3F6E]"
                style={{
                  width: `${Math.max(
                    featuredLesson.status === "not_started" ? 8 : 20,
                    featuredProgress.progressPercentage ||
                      (featuredLesson.status === "not_started" ? 0 : 40),
                  )}%`,
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
        {teacherLessonList.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {teacherLessonList.map((lesson) => (
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
          {visibleCompletedLessons.length > 0 ? (
            visibleCompletedLessons.map((lesson) => (
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
  const imageUrl = getLessonVisualUrl(lesson);

  return (
    <div
      className="box-border flex h-[184px] flex-col justify-between rounded-[20px] border border-black/5 bg-[#FCFCFC] p-[25px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#F7F1E6] shrink-0">
          <img
            src={imageUrl}
            alt={lesson.title}
            className="h-full w-full object-cover opacity-90"
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

function StudentLessonsSkeleton() {
  return (
    <div className="w-full max-w-[688px] animate-pulse">
      <div className="h-12 w-36 rounded-2xl bg-[#E8E1D5]" />
      <div className="mt-3 h-6 w-72 rounded-xl bg-[#EEE7DB]" />

      <section className="mb-10 mt-8">
        <div className="w-full rounded-3xl border border-black/5 bg-[#FCFCFC] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="flex min-h-[221px] w-full flex-col justify-between lg:w-[312px]">
              <div>
                <div className="h-4 w-40 rounded-full bg-[#E4DDCF]" />
                <div className="mt-4 h-10 w-full max-w-[280px] rounded-2xl bg-[#E8E1D5]" />
                <div className="mt-3 h-10 w-4/5 rounded-2xl bg-[#EEE7DB]" />
                <div className="mt-6 h-8 w-36 rounded-full bg-[#F1EBDD]" />
              </div>
              <div className="mt-4 h-14 w-full rounded-2xl bg-[#D7D0E9] sm:w-[190px]" />
            </div>

            <div className="h-[220px] w-full rounded-2xl bg-[#E8E1D5] lg:h-[180px] lg:w-[280px]" />
          </div>

          <div className="mt-5 h-2 w-full rounded-full bg-[#ECE5D8]" />
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-5 h-7 w-40 rounded-xl bg-[#E4DDCF]" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`teacher-lesson-skeleton-${index}`}
              className="flex h-[184px] flex-col justify-between rounded-[20px] border border-black/5 bg-[#FCFCFC] p-[25px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-2xl bg-[#E8E1D5] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="h-6 w-4/5 rounded-xl bg-[#E8E1D5]" />
                  <div className="mt-3 h-4 w-24 rounded-lg bg-[#EEE7DB]" />
                </div>
              </div>
              <div className="flex justify-end">
                <div className="h-[41px] w-24 rounded-xl bg-[#EEE7DB]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-black/5 pt-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-28 rounded-xl bg-[#E4DDCF]" />
          <div className="h-5 w-28 rounded-lg bg-[#EEE7DB]" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`completed-skeleton-${index}`}
              className="flex items-center gap-3 rounded-xl border border-[#E9E7E2] bg-white px-5 py-4"
            >
              <div className="h-8 w-8 rounded-full bg-[#E8E1D5] shrink-0" />
              <div className="flex-1">
                <div className="h-5 w-40 rounded-lg bg-[#E8E1D5]" />
                <div className="mt-2 h-4 w-20 rounded-lg bg-[#EEE7DB]" />
              </div>
              <div className="h-4 w-12 rounded-lg bg-[#EEE7DB]" />
            </div>
          ))}
        </div>
      </section>
    </div>
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
  const [downloadBusy, setDownloadBusy] = useState(false);
  const colors = subjectColors[lesson.subject] || {
    bg: "#E9E7E2",
    text: "#3B3F6E",
    banner: "#C0BDD4",
  };
  const lessonId = String(lesson.lessonId || lesson.id);

  const showOfflineStorageError = (
    error: unknown,
    action: "download" | "remove",
  ) => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : action === "download"
            ? "This device could not save the lesson for offline use."
            : "This device could not remove the offline lesson.";

    toast({
      title:
        action === "download"
          ? "Offline download unavailable"
          : "Offline update failed",
      message,
      variant: "error",
      durationMs: 5200,
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDownloadState() {
      const cachedPackage = await getStoredOfflineLessonPackage(lessonId);
      if (cachedPackage && !cancelled) {
        setDownloadOffline(true);
      }

      const res = await getStudentDownloads();
      if (cancelled) return;
      if (Array.isArray(res?.data?.downloads)) {
        setDownloadOffline(
          res.data.downloads.some((entry: any) => entry.lesson_id === lessonId) ||
            Boolean(cachedPackage),
        );
      }
    }

    loadDownloadState().catch((err) => {
      console.error("Failed to load lesson download state", err);
    });

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const toggleOfflineDownload = async () => {
    if (downloadBusy) return;
    setDownloadBusy(true);
    try {
      if (!downloadOffline) {
        let packagePayload: OfflineLessonPackage | null = null;
        let manifestLessonId = lessonId;

        const packageRes = await getLessonDownloadPackage(lessonId);
        if (!packageRes?.error && packageRes?.data) {
          packagePayload = packageRes.data as OfflineLessonPackage;
          manifestLessonId = String(packagePayload.lesson_id || lessonId);
        } else if (
          typeof packageRes?.error === "string" &&
          packageRes.error.includes("Not Found")
        ) {
          const playRes = await fetch(
            `/api/lessons/${encodeURIComponent(lessonId)}/play`,
          );
          const playData = await playRes.json().catch(() => null);

          if (!playRes.ok || !playData) {
            throw new Error(
              packageRes?.error || "Failed to fetch lesson package",
            );
          }

          const contentBlocks = Array.isArray(playData?.concepts)
            ? playData.concepts
            : [];
          const estimatedSize = new TextEncoder().encode(
            JSON.stringify(contentBlocks),
          ).length;
          const originalLessonId = String(
            playData?.original_lesson_id || lessonId,
          );

          packagePayload = {
            lesson_id: lessonId,
            original_lesson_id: originalLessonId,
            title: playData?.lesson_title || lesson.title || "Lesson",
            subject: lesson.subject || null,
            topic: lesson.topic || null,
            version_hash: computeOfflineVersionHash(contentBlocks),
            estimated_size_bytes: estimatedSize,
            content_blocks: contentBlocks,
            media_urls: extractOfflineMediaUrls(contentBlocks),
          };
          manifestLessonId = originalLessonId;
        } else {
          throw new Error(packageRes?.error || "Failed to fetch lesson package");
        }

        const preparedPackage = await prepareOfflineLessonPackage(
          packagePayload as OfflineLessonPackage,
        );
        await saveOfflineLessonPackage(preparedPackage);

        const recordCandidates = getUniqueLessonIdCandidates(
          manifestLessonId,
          lessonId,
          (packagePayload as OfflineLessonPackage)?.original_lesson_id,
          (packagePayload as OfflineLessonPackage)?.lesson_id,
        );

        let manifestSynced = false;
        let lastRecordError: string | undefined;
        for (const candidateId of recordCandidates) {
          const recordRes = await recordStudentDownload({
            lesson_id: candidateId,
            version_hash: preparedPackage.version_hash,
            size_bytes: Number(preparedPackage.estimated_size_bytes || 0),
          });
          if (!recordRes?.error) {
            manifestSynced = true;
            break;
          }
          lastRecordError = recordRes.error;
        }

        if (!manifestSynced && lastRecordError) {
          console.warn("Skipped download manifest sync", lastRecordError);
        }
        setDownloadOffline(true);
      } else {
        const cachedPackage = await getStoredOfflineLessonPackage(lessonId);
        const removeCandidates = getUniqueLessonIdCandidates(
          (cachedPackage as any)?.original_lesson_id,
          lessonId,
          (cachedPackage as any)?.lesson_id,
        );
        await removeOfflineLessonPackage(lessonId);
        if (typeof navigator === "undefined" || navigator.onLine !== false) {
          let removalSynced = false;
          let lastRemoveError: string | undefined;
          for (const candidateId of removeCandidates) {
            const removeRes = await removeStudentDownload(candidateId);
            if (!removeRes?.error) {
              removalSynced = true;
              break;
            }
            lastRemoveError = removeRes.error;
          }
          if (!removalSynced && lastRemoveError) {
            console.warn("Skipped download manifest removal sync", lastRemoveError);
          }
        }
        setDownloadOffline(false);
      }
    } catch (err) {
      console.error("Failed to update offline lesson state", err);
      showOfflineStorageError(err, downloadOffline ? "remove" : "download");
    } finally {
      setDownloadBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F7F1E6]">
      {/* Scrollable content */}
      <div className="flex-1">
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
              <div className="flex items-center gap-2">
                <span className="text-[14px] text-[#2B2B2F] font-medium">
                  Download for offline use
                </span>
                {downloadBusy ? (
                  <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#3B3F6E]/70">
                    <span className="h-3 w-3 animate-spin rounded-full border border-[#3B3F6E]/25 border-t-[#3B3F6E]" />
                    {downloadOffline ? "Removing..." : "Downloading..."}
                  </span>
                ) : null}
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={toggleOfflineDownload}
              disabled={downloadBusy}
              className={`relative h-[24px] w-[44px] rounded-full transition-colors duration-200 ${
                downloadBusy ? "cursor-wait opacity-80" : "cursor-pointer"
              } ${
                downloadOffline ? "bg-[#3B3F6E]" : "bg-[#D5D3CE]"
              }`}
            >
              <div
                className={`absolute top-[2px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  downloadOffline ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              >
                {downloadBusy ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-[#3B3F6E]/20 border-t-[#3B3F6E]" />
                ) : null}
              </div>
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
  const lessonPath = `/lesson/${lesson.lessonId || lesson.id}`;
  const resumePath = getLessonResumePath(lesson);

  switch (lesson.status) {
    case "not_started":
      return (
        <button
          onClick={() => router.push(lessonPath)}
          className="w-full py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer"
        >
          Start Lesson
        </button>
      );
    case "in_progress":
      return (
        <div className="flex gap-4">
          <button
            onClick={() => router.push(resumePath)}
            className="flex-[2] py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer"
          >
            Continue Lesson
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
          Review Lesson
        </button>
      );
  }
}

interface DownloadedLesson {
  id: string;
  title: string;
  subject: string;
  size: string;
  sizeBytes: number;
  source: "local" | "remote";
}

function mapOfflinePackageToDownloadedLesson(
  pkg: OfflineLessonPackage,
): DownloadedLesson {
  return {
    id: String(pkg.lesson_id),
    title: pkg.title || "Lesson",
    subject: pkg.subject || "Subject",
    size: formatStorageSize(Number(pkg.estimated_size_bytes || 0)),
    sizeBytes: Number(pkg.estimated_size_bytes || 0),
    source: "local",
  };
}

function getStoredDownloadsSnapshot() {
  return listStoredOfflineLessonPackages().then((packages) => ({
    lessons: packages.map(mapOfflinePackageToDownloadedLesson),
    totalSizeBytes: packages.reduce(
      (total, pkg) => total + Number(pkg.estimated_size_bytes || 0),
      0,
    ),
  }));
}

function StudentDownloadsView() {
  const [lessons, setLessons] = useState<DownloadedLesson[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<DownloadedLesson | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine === false : false,
  );
  const router = useRouter();

  useEffect(() => {
    const syncOnlineState = () => {
      setIsOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    };

    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDownloads() {
      setLoading(true);
      const storedSnapshot = await getStoredDownloadsSnapshot();
      if (!cancelled && storedSnapshot.lessons.length > 0) {
        setLessons(storedSnapshot.lessons);
        setTotalSizeBytes(storedSnapshot.totalSizeBytes);
      }

      const res = await getStudentDownloads();
      if (cancelled) return;

      if (res?.data && storedSnapshot.lessons.length === 0) {
        const downloads = Array.isArray(res.data.downloads)
          ? res.data.downloads
          : [];
        setLessons(
          downloads.map(
            (entry: any): DownloadedLesson => ({
              id: String(entry.lesson_id),
              title: entry.title || "Lesson",
              subject: entry.subject || "Subject",
              size: formatStorageSize(Number(entry.estimated_size_bytes || 0)),
              sizeBytes: Number(entry.estimated_size_bytes || 0),
              source: "remote",
            }),
          ),
        );
        setTotalSizeBytes(Number(res.data.total_size_bytes || 0));
      }

      setLoading(false);
    }

    loadDownloads().catch((err) => {
      console.error("Failed to load downloads", err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemove = async () => {
    if (!removeTarget || removing) return;
    setRemoving(true);
    try {
      if (removeTarget.source === "local") {
        await removeOfflineLessonPackage(removeTarget.id);
      }
      if (typeof navigator === "undefined" || navigator.onLine !== false) {
        const res = await removeStudentDownload(removeTarget.id);
        if (res?.error) {
          throw new Error(res.error);
        }
      }
      setLessons((prev) => prev.filter((lesson) => lesson.id !== removeTarget.id));
      setRemoveTarget(null);
      setMenuOpenId(null);
      if (removeTarget.source === "local") {
        const storedSnapshot = await getStoredDownloadsSnapshot();
        setTotalSizeBytes(storedSnapshot.totalSizeBytes);
      } else {
        setTotalSizeBytes((prev) => Math.max(0, prev - removeTarget.sizeBytes));
      }
    } catch (err) {
      console.error("Failed to remove download", err);
      toast({
        title: "Offline update failed",
        message:
          err instanceof Error
            ? err.message
            : "This device could not remove the offline lesson.",
        variant: "error",
        durationMs: 5200,
      });
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full max-w-[820px] flex-col">
        <h1 className="text-[24px] font-bold text-[#3B3F6E] tracking-[-0.01em] mb-6">
          Downloads
        </h1>
        <p className="text-[14px] text-graphite-60">Loading downloads...</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
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

        <button
          onClick={() => router.push(getDashboardPath("student", "lessons"))}
          className="px-7 py-[11px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[14px] font-semibold transition-colors cursor-pointer"
        >
          Browse lessons
        </button>
      </div>
    );
  }

  return (
      <div className="flex h-full max-w-[820px] flex-col">
      {menuOpenId ? (
        <button
          type="button"
          aria-label="Close download actions"
          onClick={() => setMenuOpenId(null)}
          className="fixed inset-0 z-10 cursor-default"
        />
      ) : null}

      {isOffline ? (
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
      ) : null}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-bold text-[#3B3F6E] tracking-[-0.01em]">
          Downloads
        </h1>
        <span className="text-[13px] text-graphite-60 font-medium">
          {formatStorageSize(totalSizeBytes)} used
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
              <div className="absolute right-6 top-[72px] z-20 animate-fade-in rounded-xl border border-[#E9E7E2] bg-white py-2 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
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
                  disabled={removing}
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

function StudentConnectView({
  profile,
  loading = false,
}: {
  profile?: any;
  loading?: boolean;
}) {
  const [classCode, setClassCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [connectionsData, setConnectionsData] = useState<any[]>(
    profile?.connections || [],
  );
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  const isNevoIdLoaded = Boolean(profile);
  const nevoId =
    profile?.nevo_id ||
    profile?.nevoId ||
    profile?.nevo ||
    profile?.student_id ||
    profile?.studentId ||
    profile?.id ||
    profile?.data?.nevo_id ||
    profile?.data?.nevoId ||
    profile?.data?.student_id ||
    profile?.data?.studentId ||
    profile?.data?.nevo ||
    profile?.data?.id ||
    "Unavailable";

  const handleCopy = () => {
    navigator.clipboard?.writeText(nevoId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openQr = () => setShowQr(true);

  const getTokenFromCookie = () => {
    try {
      const m = document.cookie.match(/(?:^|; )access_token=([^;]+)/);
      return m ? decodeURIComponent(m[1]) : null;
    } catch {
      return null;
    }
  };

  const getConnectionPayload = (value: any) => {
    if (value?.data && typeof value.data === "object") {
      return value.data;
    }
    return value && typeof value === "object" ? value : {};
  };

  const getConnectionList = (...values: unknown[]) => {
    for (const value of values) {
      if (Array.isArray(value)) {
        return value;
      }
    }
    return [];
  };

  const getConnectionId = (connection: any) =>
    String(
      connection?.connection_id ??
        connection?.connectionId ??
        connection?.id ??
        connection?.teacher_id ??
        connection?.teacherId ??
        connection?.teacher?.id ??
        getTeacherDisplayName(connection),
    );

  const getTeacherDisplayName = (connection: any) =>
    connection?.teacher_name ||
    connection?.teacherName ||
    connection?.teacher?.full_name ||
    connection?.teacher?.fullName ||
    connection?.teacher?.name ||
    connection?.full_name ||
    connection?.fullName ||
    connection?.name ||
    "Teacher";

  const getConnectionSubject = (connection: any) =>
    connection?.subject ||
    connection?.teacher_subject ||
    connection?.teacherSubject ||
    connection?.teacher?.subject ||
    connection?.class_name ||
    connection?.className ||
    "Teacher";

  const fetchConnections = async () => {
    setLoadingConnections(true);
    setConnectError(null);
    try {
      const result = await getStudentConnections();
      if (result?.error) {
        setConnectError(result.error || "Failed to load connections");
        setConnectionsData([]);
        setPendingRequests([]);
        return;
      }

      const data = getConnectionPayload(result?.data ?? result);
      const connected = getConnectionList(
        data?.connected,
        data?.accepted,
        data?.connections,
        data?.teachers,
      );
      const pending = getConnectionList(
        data?.pending,
        data?.pending_requests,
        data?.pendingRequests,
        data?.requests,
      );

      setConnectionsData(connected);
      setPendingRequests(pending);
    } catch (err: any) {
      setConnectError(err?.message || "Failed to load connections");
      setConnectionsData([]);
      setPendingRequests([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    void fetchConnections();
  }, []);

  const acceptedConnections = connectionsData;

  if (loading && !profile) {
    return <StudentConnectSkeleton />;
  }

  const handleConnectClass = async () => {
    setConnectError(null);
    const code = classCode.trim();
    if (!code) {
      setConnectError("Please enter a class code or Nevo ID");
      return;
    }

    const token = getTokenFromCookie();
    if (!token) {
      setConnectError("Not authenticated");
      return;
    }

    try {
      const normalized = code.toUpperCase();
      const payload = normalized.startsWith("NEVO-CLASS-")
        ? { class_code: normalized }
        : { teacher_nevo_id: normalized };

      const res = await fetch("/api/teachers/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setConnectError(data?.detail || data?.error || "Failed to connect");
        return;
      }

      // Refresh connections
      setClassCode("");
      await fetchConnections();
    } catch (err: any) {
      setConnectError(err?.message || "Failed to connect");
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      const res = await fetch(
        `/api/students/connection-requests/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setConnectError(
          data?.detail || data?.error || "Failed to cancel request",
        );
        return;
      }
      await fetchConnections();
    } catch (err: any) {
      setConnectError(err?.message || "Failed to cancel request");
    }
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
          <div className="mt-1 mb-4">
            {isNevoIdLoaded ? (
              <h2 className="text-[28px] font-bold text-[#2B2B2F] tracking-[-0.01em]">
                {nevoId}
              </h2>
            ) : (
              <div className="h-[34px] w-[160px] rounded-xl bg-[#EEECEA] animate-pulse" />
            )}
          </div>
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
            <button
              onClick={openQr}
              className="flex items-center gap-2 px-4 py-[7px] border-2 border-[#E9E7E2] rounded-full text-[12px] font-semibold text-[#3B3F6E] bg-parchment transition-colors cursor-pointer"
            >
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
        {/* QR Modal */}
        {showQr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowQr(false)}
            />
            <div className="bg-white rounded-lg p-6 z-10">
              <h3 className="text-[16px] font-semibold mb-4">Your Nevo QR</h3>
              <div className="flex items-center justify-center">
                <div style={{ width: 200, height: 200 }}>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <QRInner value={nevoId} />
                  </React.Suspense>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowQr(false)}
                  className="px-4 py-2 bg-[#3B3F6E] text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowScanner(false)}
            />
            <div className="bg-white rounded-lg p-4 z-10 w-[520px]">
              <h3 className="text-[16px] font-semibold mb-3">
                Scan QR to connect
              </h3>
              <div className="w-full h-[360px] bg-black/5 rounded mb-3">
                <ScannerInner
                  onDetected={(text: string) => {
                    setShowScanner(false);
                    setClassCode(text);
                    void handleConnectClass();
                  }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowScanner(false)}
                  className="px-4 py-2 bg-[#3B3F6E] text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="flex gap-2">
          <button
            onClick={openQr}
            className="px-5 py-[9px] bg-white text-[#3B3F6E] rounded-full text-[13px] font-semibold border border-[#E9E7E2] transition-colors cursor-pointer"
          >
            Show QR
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="px-5 py-[9px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-full text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Open Scanner
          </button>
        </div>
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
              <button
                onClick={() => void handleConnectClass()}
                className="flex items-center gap-1 px-5 py-[8px] border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all cursor-pointer shrink-0"
              >
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
            {connectError ? (
              <p className="text-[13px] text-[#C0392B] mt-2">{connectError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pending and Connected */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending */}
        <div>
          <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">Pending</h4>
          {pendingRequests.length === 0 ? (
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
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const reqId = getConnectionId(req);
                return (
                  <div
                    key={reqId}
                    className="bg-white rounded-2xl border border-[#E9E7E2] px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-[#2B2B2F]">
                        {getTeacherDisplayName(req)}
                      </p>
                      <p className="text-[12px] text-graphite-40">
                        {getConnectionSubject(req)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCancelRequest(reqId)}
                        className="px-3 py-2 text-[13px] border border-[#E9E7E2] rounded-full text-[#C0392B]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Connected */}
        <div>
          <h4 className="text-[15px] font-bold text-[#2B2B2F] mb-4">
            Connected
          </h4>
          {loadingConnections ? (
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 text-[13px] text-graphite-40 font-medium">
              Loading...
            </div>
          ) : connectError ? (
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] px-6 py-8 text-[13px] text-[#C0392B] font-medium">
              {connectError}
            </div>
          ) : acceptedConnections.length > 0 ? (
            <div className="bg-white rounded-2xl border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden">
              {acceptedConnections.map((conn: any) => {
                const teacherName = getTeacherDisplayName(conn);
                return (
                  <div
                    key={getConnectionId(conn)}
                    className="flex items-center gap-3 px-5 py-4 border-b border-[#F0EDE7] last:border-b-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8D5C4] flex items-center justify-center text-[12px] font-bold text-[#5C4A32] shrink-0">
                      {teacherName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13.5px] font-semibold text-[#2B2B2F]">
                        {teacherName}
                      </p>
                      <p className="text-[11.5px] text-graphite-40">
                        {getConnectionSubject(conn)}
                      </p>
                    </div>
                  </div>
                );
              })}
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

function StudentConnectSkeleton() {
  return (
    <div className="max-w-[820px] animate-pulse">
      <div className="h-10 w-32 rounded-2xl bg-[#E8E1D5]" />
      <div className="mt-3 h-6 w-56 rounded-xl bg-[#EEE7DB]" />

      <div className="mt-8 rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#E8E1D5] shrink-0" />
          <div className="flex-1">
            <div className="h-5 w-40 rounded-lg bg-[#E8E1D5]" />
            <div className="mt-2 h-4 w-52 rounded-lg bg-[#EEE7DB]" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-[#EEE7DB]" />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#E8E1D5] shrink-0" />
          <div className="flex-1">
            <div className="h-5 w-44 rounded-lg bg-[#E8E1D5]" />
            <div className="mt-2 h-4 w-48 rounded-lg bg-[#EEE7DB]" />
          </div>
          <div className="h-10 w-28 rounded-xl bg-[#EEE7DB]" />
        </div>
      </div>

      <div className="mt-8 h-7 w-36 rounded-xl bg-[#E4DDCF]" />
      <div className="mt-5 rounded-2xl border border-[#E9E7E2] bg-white px-6 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`connect-skeleton-row-${index}`}
            className={`flex items-center gap-3 py-4 ${index === 0 ? "border-b border-[#F0EDE7]" : ""}`}
          >
            <div className="h-10 w-10 rounded-full bg-[#E8E1D5] shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded-lg bg-[#E8E1D5]" />
              <div className="mt-2 h-3 w-20 rounded-lg bg-[#EEE7DB]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile View ──────────────────────────────────────────────────────────────
function StudentProfileView({
  user,
  profile,
  onLogout,
  loading = false,
}: {
  user?: any;
  profile?: any;
  onLogout: () => Promise<void>;
  loading?: boolean;
}) {
  const guardAuth = useAuthGuard("student");
  const [settings, setSettings] = useState<StudentSettingsState>(
    defaultStudentSettings,
  );
  const [localProfile, setLocalProfile] = useState<any>(profile);
  const [resolvedNames, setResolvedNames] = useState<{
    schoolName?: string;
    className?: string;
  }>({});
  const [showLogout, setShowLogout] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [idCopied, setIdCopied] = useState(false);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  useEffect(() => {
    const inlineSettings = {
      ...(localProfile?.accessibility || {}),
      ...(localProfile?.settings || {}),
    };

    if (Object.keys(inlineSettings).length > 0) {
      setSettings(normalizeStudentSettings(inlineSettings));
    }
  }, [localProfile]);

  useEffect(() => {
    let cancelled = false;

    const schoolId =
      localProfile?.school_id ||
      localProfile?.schoolId ||
      localProfile?.school?.id ||
      user?.school_id ||
      user?.schoolId ||
      user?.school?.id;
    const classId =
      localProfile?.class_id ||
      localProfile?.classId ||
      localProfile?.class?.id ||
      user?.class_id ||
      user?.classId ||
      user?.class?.id;

    const existingSchoolName =
      localProfile?.school?.school_name ||
      localProfile?.school?.name ||
      localProfile?.school_name ||
      user?.school?.school_name ||
      user?.school?.name ||
      user?.school_name;
    const existingClassName =
      localProfile?.class?.class_name ||
      localProfile?.class?.name ||
      localProfile?.class_name ||
      localProfile?.grade_level ||
      user?.class?.class_name ||
      user?.class?.name ||
      user?.class_name;

    async function loadOrganizationNames() {
      const nextResolved: { schoolName?: string; className?: string } = {};

      if (!existingSchoolName && schoolId) {
        const schoolRes = await getStudentSchoolById(String(schoolId));
        if (!cancelled && !guardAuth(schoolRes as any) && schoolRes?.data) {
          nextResolved.schoolName =
            schoolRes.data.school_name ||
            schoolRes.data.name ||
            schoolRes.data.data?.school_name ||
            schoolRes.data.data?.name ||
            "";
        }
      }

      if (!existingClassName && schoolId && classId) {
        const classesRes = await getStudentSchoolClasses(String(schoolId));
        if (!cancelled && !guardAuth(classesRes as any) && classesRes?.data) {
          const classList = Array.isArray(classesRes.data)
            ? classesRes.data
            : Array.isArray(classesRes.data?.classes)
              ? classesRes.data.classes
              : Array.isArray(classesRes.data?.data)
                ? classesRes.data.data
                : [];

          const matchedClass = classList.find((item: any) => {
            const candidateId =
              item?.id || item?.class_id || item?.classId || item?.uuid;
            return String(candidateId) === String(classId);
          });

          nextResolved.className =
            matchedClass?.class_name || matchedClass?.name || "";
        }
      }

      if (!cancelled) {
        setResolvedNames(nextResolved);
      }
    }

    if (
      (!existingSchoolName && schoolId) ||
      (!existingClassName && schoolId && classId)
    ) {
      loadOrganizationNames().catch((err) => {
        console.error("Failed to resolve student organization names", err);
      });
    } else {
      setResolvedNames({});
    }

    return () => {
      cancelled = true;
    };
  }, [guardAuth, localProfile, user]);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const res = await getStudentSettings();
      if (cancelled || guardAuth(res as any) || !res?.data) return;
      setSettings(normalizeStudentSettings(res.data));
    }

    loadSettings().catch((err) => {
      console.error("Failed to load student settings", err);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.name ||
    localProfile?.student_name ||
    localProfile?.first_name ||
    localProfile?.name ||
    "Student";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";
  const schoolObj = localProfile?.school || user?.school || {};
  const classObj = localProfile?.class || user?.class || {};
  const schoolName =
    resolvedNames.schoolName ||
    schoolObj.school_name ||
    schoolObj.name ||
    localProfile?.school_name ||
    user?.school_name ||
    "";
  const gradeLevel =
    resolvedNames.className ||
    classObj.class_name ||
    classObj.name ||
    localProfile?.class_name ||
    localProfile?.grade_level ||
    user?.class_name ||
    "";
  const subtitleParts = [schoolName, gradeLevel].filter(Boolean);
  const nevoId = getStudentDisplayId(localProfile, user) || "Unavailable";
  const learningProfile = localProfile?.learning_profile || localProfile || null;
  const howYouLearn = localProfile?.how_you_learn || {};

  // Convert backend learning_profile to UI mapping
  const learningStyle =
    learningProfile?.learning_preference ||
    learningProfile?.learning_modality ||
    learningProfile?.learningStyle ||
    howYouLearn?.learning_style ||
    "Not set";
  const focusDuration =
    learningProfile?.focus_duration ??
    learningProfile?.focusTime ??
    howYouLearn?.focus_time_minutes;
  const focusTime = focusDuration ? `${focusDuration} min` : "Not set";
  const challengeLevel =
    learningProfile?.challenge_preference ||
    learningProfile?.challenge_pref ||
    learningProfile?.challengeLevel ||
    howYouLearn?.challenge_level ||
    "Not set";

  const handleCopyId = () => {
    navigator.clipboard?.writeText(nevoId).catch(() => {});
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  if (loading && !profile) {
    return <StudentProfileSkeleton />;
  }

  const toggleSetting = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));

    try {
      const requestKeyMap: Record<keyof StudentSettingsState, string> = {
        adaptAutomatically: "adapt_automatically",
        cameraForLearningSignals: "camera_for_learning_signals",
        voiceGuidance: "voice_guidance",
        notifications: "notifications",
      };
      const res = await updateStudentSettings({
        [requestKeyMap[key]]: newValue,
      });
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
    return (
      <EditPreferencesView
        profile={learningProfile}
        onBack={() => setShowPreferences(false)}
        onSaved={(updatedProfile) => {
          setLocalProfile((prev: any) => ({
            ...(prev || {}),
            ...updatedProfile,
          }));
          setShowPreferences(false);
        }}
      />
    );
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
          {subtitleParts.length > 0 ? (
            <p className="text-[13px] text-graphite-60">
              {subtitleParts.join(" · ")}
            </p>
          ) : null}
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

function StudentProfileSkeleton() {
  return (
    <div className="max-w-[820px] animate-pulse">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-[56px] w-[56px] rounded-full bg-[#E8E1D5] shrink-0" />
        <div>
          <div className="h-6 w-40 rounded-xl bg-[#E8E1D5]" />
          <div className="mt-2 h-4 w-48 rounded-lg bg-[#EEE7DB]" />
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-4 h-4 w-28 rounded-full bg-[#E4DDCF]" />
        <div className="overflow-hidden rounded-2xl border border-[#E9E7E2] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`profile-learning-skeleton-${index}`}
              className={`flex items-center justify-between px-6 py-4 ${index < 2 ? "border-b border-[#F0EDE7]" : ""}`}
            >
              <div className="h-5 w-36 rounded-lg bg-[#E8E1D5]" />
              <div className="h-5 w-24 rounded-lg bg-[#EEE7DB]" />
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 h-4 w-20 rounded-full bg-[#E4DDCF]" />
        <div className="overflow-hidden rounded-2xl border border-[#E9E7E2] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`profile-setting-skeleton-${index}`}
              className={`flex items-center justify-between px-6 py-4 ${index < 3 ? "border-b border-[#F0EDE7]" : ""}`}
            >
              <div className="h-5 w-44 rounded-lg bg-[#E8E1D5]" />
              <div className="h-6 w-11 rounded-full bg-[#EEE7DB]" />
            </div>
          ))}
        </div>
      </section>

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#E9E7E2] bg-white px-6 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="h-5 w-20 rounded-lg bg-[#E8E1D5]" />
        <div className="h-5 w-28 rounded-lg bg-[#EEE7DB]" />
      </div>

      <div className="flex justify-center">
        <div className="h-5 w-16 rounded-lg bg-[#EEE7DB]" />
      </div>
    </div>
  );
}

// ─── Edit Preferences View ─────────────────────────────────────────────────────
function EditPreferencesView({
  profile,
  onBack,
  onSaved,
}: {
  profile: any;
  onBack: () => void;
  onSaved: (updatedProfile: Record<string, unknown>) => void;
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [form, setForm] = useState({
    learning_preference: profile?.learning_preference || "visual",
    focus_duration: Number(profile?.focus_duration || 15),
    challenge_preference: profile?.challenge_preference || "moderate",
    motivation_trigger: profile?.motivation_trigger || "encouragement",
    pace_preference: profile?.pace_preference || "steady",
    tts_preference: profile?.tts_preference || "on_demand",
  });

  const updateField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowSaveModal(true);
    } else {
      onBack();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        attention_span_minutes: Number(form.focus_duration),
      };
      const res = await updateStudentLearningProfile(payload);
      if (res?.error) {
        throw new Error(res.error);
      }
      onSaved(payload);
    } catch (err) {
      console.error("Failed to save student preferences", err);
    } finally {
      setSaving(false);
      setShowSaveModal(false);
    }
  };

  return (
    <div className="max-w-[820px]">
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

      <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">
        Your learning style
      </h2>

      <div className="flex flex-col gap-7">
        <PreferenceGroup
          label="Learning Preference"
          options={[
            { value: "visual", label: "Watching and looking" },
            { value: "audio", label: "Listening to explanations" },
            { value: "action", label: "Doing with hands" },
            { value: "reading", label: "Reading on my own" },
          ]}
          value={String(form.learning_preference)}
          onSelect={(value) => updateField("learning_preference", value)}
        />
        <PreferenceGroup
          label="Focus Time"
          options={[
            { value: "5", label: "5 minutes" },
            { value: "10", label: "10 minutes" },
            { value: "15", label: "15 minutes" },
            { value: "20", label: "20 minutes" },
          ]}
          value={String(form.focus_duration)}
          onSelect={(value) => updateField("focus_duration", Number(value))}
        />
        <PreferenceGroup
          label="Challenge Level"
          options={[
            { value: "gentle", label: "Gentle" },
            { value: "moderate", label: "Moderate" },
            { value: "stretch", label: "Stretch me" },
          ]}
          value={String(form.challenge_preference)}
          onSelect={(value) => updateField("challenge_preference", value)}
        />
        <PreferenceGroup
          label="Pace"
          options={[
            { value: "slower", label: "Take it slowly" },
            { value: "steady", label: "Steady pace" },
            { value: "faster", label: "Move faster" },
          ]}
          value={String(form.pace_preference)}
          onSelect={(value) => updateField("pace_preference", value)}
        />
        <PreferenceGroup
          label="Voice Guidance"
          options={[
            { value: "off", label: "Keep voice off" },
            { value: "on_demand", label: "Only when I ask" },
            { value: "always", label: "Read aloud often" },
          ]}
          value={String(form.tts_preference)}
          onSelect={(value) => updateField("tts_preference", value)}
        />
        <PreferenceGroup
          label="Motivation Trigger"
          options={[
            { value: "encouragement", label: "Encouragement" },
            { value: "progress", label: "Progress tracking" },
            { value: "challenge", label: "A good challenge" },
          ]}
          value={String(form.motivation_trigger)}
          onSelect={(value) => updateField("motivation_trigger", value)}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full mt-8 py-[14px] bg-[#3B3F6E] hover:bg-[#2C2F52] text-white rounded-xl text-[15px] font-semibold transition-colors cursor-pointer"
      >
        Save preferences
      </button>
      <p className="text-[12px] text-graphite-40 text-center mt-3">
        Saving your preferences updates how Nevo adapts future lessons.
      </p>

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
                  onClick={handleSave}
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

function PreferenceGroup({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-bold text-[#3B3F6E] tracking-[0.08em] uppercase mb-3">
        {label}
      </h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`px-4 py-[8px] rounded-full text-[13px] font-medium border-2 transition-all cursor-pointer ${
                isActive
                  ? "bg-[#3B3F6E] text-white border-[#3B3F6E]"
                  : "bg-white text-[#2B2B2F] border-[#E9E7E2] hover:border-[#3B3F6E]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
