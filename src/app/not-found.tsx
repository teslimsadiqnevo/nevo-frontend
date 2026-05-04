'use client';

import Link from 'next/link';

const QUICK_LINKS = [
  { href: '/', label: 'Go home' },
  { href: '/dashboard', label: 'Open dashboard' },
  { href: '/login', label: 'Sign in' },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-parchment px-6 py-10 text-graphite">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-[#E0D9CE] bg-[#FAF9F6] shadow-[0_24px_80px_rgba(59,63,110,0.08)]">
        <div className="hidden w-[320px] flex-col justify-between bg-[#3B3F6E] px-8 py-9 text-parchment lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                <span className="text-[22px] font-semibold">N</span>
              </div>
              <span className="text-[28px] font-semibold tracking-[-0.02em]">Nevo</span>
            </div>

            <div className="mt-16">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#CFC8F1]">
                Lost Page
              </p>
              <h1 className="mt-4 max-w-[220px] text-[34px] font-semibold leading-[1.1]">
                We couldn&apos;t find that page.
              </h1>
              <p className="mt-5 max-w-[230px] text-[15px] leading-7 text-[#E7E1F7]">
                Nevo can still get you back to the right lesson, dashboard, or sign-in flow.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/15 bg-white/8 p-5">
            <p className="text-[13px] font-semibold text-white">Helpful next step</p>
            <p className="mt-2 text-[14px] leading-6 text-[#E7E1F7]">
              If you opened an old lesson or invite link, head back to your dashboard and reopen it from there.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-[620px]">
            <div className="inline-flex items-center rounded-full bg-[#E8E6F5] px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6E74AA]">
              Error 404
            </div>

            <h2 className="mt-6 text-[36px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#3B3F6E] sm:text-[48px]">
              This page is not here anymore.
            </h2>

            <p className="mt-5 max-w-[520px] text-[16px] leading-8 text-graphite-60">
              The link may be broken, the page may have moved, or the lesson route may no longer be valid.
              You can jump back to the core areas below.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-14 items-center justify-center rounded-2xl border border-[#3B3F6E] bg-white px-5 text-[15px] font-semibold text-[#3B3F6E] transition-colors hover:bg-[#3B3F6E] hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-10 rounded-[24px] border border-[#E0D9CE] bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1EEE7] text-[24px] text-[#3B3F6E]">
                  ?
                </div>
                <div>
                  <p className="text-[16px] font-semibold text-[#3B3F6E]">Trying to reopen a lesson?</p>
                  <p className="mt-2 text-[14px] leading-6 text-graphite-60">
                    Go back to your dashboard, open the lesson from the active assignments list, and Nevo will route
                    you into the correct start or stage page.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-6 text-[13px] leading-6 text-graphite-50">
              If this keeps happening for a real lesson or invite, the route handling likely needs attention.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
