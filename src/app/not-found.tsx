'use client';

import Link from 'next/link';
import { NevoLogo } from '@/shared/ui';

const navLinks = [
  { name: 'Platform', href: '/#platform' },
  { name: 'For Schools', href: '/#audiences' },
  { name: 'Insights', href: '/#insights' },
  { name: 'About', href: '/#about' },
];

const quickLinks = [
  { href: '/', label: 'Go home', variant: 'solid' as const },
  { href: '/dashboard', label: 'Open dashboard', variant: 'outline' as const },
  { href: '/login', label: 'Sign in', variant: 'outline' as const },
];

function PillButton({
  href,
  children,
  variant = 'solid',
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'solid' | 'outline';
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center whitespace-nowrap rounded-full transition-colors duration-200';
  const styles =
    variant === 'solid'
      ? 'bg-indigo text-white hover:bg-[#313560]'
      : 'border border-indigo text-indigo hover:bg-indigo-5';

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export default function NotFound() {
  return (
    <div className="bg-parchment text-graphite">
      <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col">
        <header className="flex h-16 items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="Nevo home" className="shrink-0 hover-lift">
              <NevoLogo width={73} height={22} />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="hover-lift text-[14px] font-medium leading-[21px] text-graphite transition-opacity duration-200 hover:opacity-70"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <PillButton
            href="/login"
            variant="outline"
            className="hover-lift h-11 px-6 text-[14px] font-medium leading-[21px] md:w-[126px]"
          >
            Sign in
          </PillButton>
        </header>

        <main className="flex flex-1 flex-col px-6 pb-16 pt-12 md:px-12 md:pb-[72px] md:pt-12">
          <section className="flex flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-[760px]">
              <div className="inline-flex rounded-full bg-lavender-20 px-4 py-2">
                <span className="text-[12px] font-medium leading-4 text-indigo">Error 404</span>
              </div>

              <h1 className="mt-6 text-[36px] font-bold leading-[1.08] md:text-[44px] md:leading-[48px]">
                The page you&apos;re looking for isn&apos;t here.
              </h1>

              <p className="pt-5 text-[16px] leading-[26px] opacity-90 md:max-w-[640px] md:text-[17px] md:leading-[27px]">
                The link may be broken, the page may have moved, or the lesson route is no longer valid.
                Nevo can still get you back to the right place quickly.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                {quickLinks.map((link) => (
                  <PillButton
                    key={link.href}
                    href={link.href}
                    variant={link.variant}
                    className="hover-lift h-[52px] px-7 text-[16px] font-semibold leading-6"
                  >
                    {link.label}
                  </PillButton>
                ))}
              </div>

              <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2">
                <article className="hover-lift rounded-[20px] bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                  <div className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-lavender-20">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <path
                        d="M14 4.66663V23.3333"
                        stroke="#3B3F6E"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4.66663 14H23.3333"
                        stroke="#3B3F6E"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-[17px] font-bold leading-[26px]">Trying to reopen a lesson?</h2>
                  <p className="pt-2 text-[14px] leading-[21px] text-graphite/80">
                    Go back to your dashboard and open the lesson again from the assigned lessons list so Nevo can route
                    you into the correct start or stage page.
                  </p>
                </article>

                <article className="hover-lift rounded-[20px] bg-white p-6 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                  <div className="mb-5 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-lavender-20">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                      <path
                        d="M7 8.16663H21"
                        stroke="#3B3F6E"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7 14H16.3333"
                        stroke="#3B3F6E"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                      <path
                        d="M7 19.8334H18.6667"
                        stroke="#3B3F6E"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <h2 className="text-[17px] font-bold leading-[26px]">Old invite or saved bookmark?</h2>
                  <p className="pt-2 text-[14px] leading-[21px] text-graphite/80">
                    Some older links may no longer point to the latest route structure. Start from home or sign in again
                    to continue safely.
                  </p>
                </article>
              </div>

              <div className="mt-12 overflow-hidden rounded-[28px] bg-lavender-10 px-6 py-10 md:px-[44px] md:py-[38px]">
                <div className="relative">
                  <div className="animate-float-gentle absolute -left-10 -top-10 h-24 w-24 rounded-full bg-white/40 blur-[24px]" />
                  <div className="animate-float-gentle absolute bottom-[-36px] right-[-12px] h-28 w-28 rounded-full bg-indigo/5 blur-[32px]" />

                  <div className="relative">
                    <h2 className="text-[28px] font-bold leading-[1.2] md:text-[32px] md:leading-[48px]">
                      Still need the right page?
                    </h2>
                    <p className="pt-3 text-[14px] leading-[21px] text-graphite/80 md:max-w-[540px]">
                      Return to the main experience and re-enter from the right flow. That usually resolves broken lesson,
                      invite, and dashboard links immediately.
                    </p>
                    <div className="pt-6">
                      <PillButton
                        href="/"
                        className="animate-pulse-glow hover-lift h-[52px] px-10 text-[16px] font-semibold leading-6 md:w-[170px]"
                      >
                        Back to Home
                      </PillButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
