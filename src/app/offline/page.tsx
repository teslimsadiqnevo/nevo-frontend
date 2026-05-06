import Link from "next/link";
import { NevoLogo } from "@/shared/ui";

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-parchment px-6 py-10 text-graphite">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center rounded-[32px] border border-graphite/5 bg-[#FAF9F6] px-8 py-12 text-center shadow-[0_20px_60px_rgba(43,43,47,0.08)]">
        <NevoLogo className="mb-10" />
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-indigo text-parchment shadow-[0_16px_32px_rgba(59,63,110,0.18)]">
          <svg
            aria-hidden="true"
            className="h-12 w-12"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 12a8 8 0 1 1 8 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M4 18v-6h6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-[-0.03em] text-graphite md:text-4xl">
          You&apos;re offline right now
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-graphite-70 md:text-lg">
          Nevo can still open lessons you already downloaded. When your connection
          returns, the rest of the app will pick up where you left off.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard?view=lessons&role=student"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-indigo px-8 text-base font-semibold text-parchment shadow-[0_10px_24px_rgba(59,63,110,0.22)] transition hover:-translate-y-0.5"
          >
            Open downloaded lessons
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-indigo/20 bg-parchment px-8 text-base font-semibold text-indigo transition hover:border-indigo/40"
          >
            Try reconnecting
          </Link>
        </div>
      </div>
    </main>
  );
}
