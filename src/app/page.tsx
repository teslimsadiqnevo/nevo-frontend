'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { NevoLogo } from "@/shared/ui";
import gradIcon from "@/shared/ui/icon/assets/grad.png";
import schoolIcon from "@/shared/ui/icon/assets/school.png";
import teacherIcon from "@/shared/ui/icon/assets/female-teacher.png";

const navLinks = [
  { name: "Platform", href: "#platform" },
  { name: "For Schools", href: "#audiences" },
  { name: "Insights", href: "#insights" },
  { name: "About", href: "#about" },
];

const audienceCards = [
  {
    icon: gradIcon,
    title: "Student / Learner",
    description:
      "A learning experience shaped around the learner. Lessons adapt to pace, attention, and learning preference with clarity at every step.",
    cta: "Continue as Student",
    href: "/login/student",
  },
  {
    icon: teacherIcon,
    title: "Teacher",
    description:
      "See beyond performance alone. Nevo helps teachers respond with clearer insight, better support, and more confidence in what each learner needs.",
    cta: "Continue as Teacher",
    href: "/login/teacher",
  },
  {
    icon: schoolIcon,
    title: "School",
    description:
      "Build a calmer learning system at scale. Support diverse learners, strengthen teaching practice, and improve outcomes through accessible design.",
    cta: "Continue as School",
    href: "/login/school",
  },
];

const principles = [
  {
    title: "Adaptive by design",
    description:
      "Nevo adapts pacing, layout, and support in response to how learners engage. It is designed for people, not templates.",
    icon: <AdaptiveIcon />,
  },
  {
    title: "Calm and cognitively safe",
    description:
      "No clutter. No pressure. Just clear learning flows that respect attention and emotional ease.",
    icon: <LeafIcon />,
  },
  {
    title: "Built for real classrooms",
    description:
      "Teachers gain meaningful insight, and schools gain visibility with care, without adding pressure or unnecessary surveillance.",
    icon: <ClassroomIcon />,
  },
];

const howItWorks = [
  {
    title: "Learners onboard in minutes",
    description:
      "A short onboarding flow helps Nevo understand learner needs quickly, without labels or lengthy forms.",
    illustration: <OnboardingIllustration />,
  },
  {
    title: "Lessons adapt automatically",
    description:
      "Whether a learner benefits from visual, audio, hands-on, or structured support, Nevo delivers the same goal in a format that fits.",
    illustration: <AdaptIllustration />,
  },
  {
    title: "Progress becomes sustainable",
    description:
      "With gentle feedback, pacing support, and strong teacher connection, progress becomes steady, realistic, and sustainable.",
    illustration: <ProgressIllustration />,
  },
];

const footerLinks = [
  { name: "Platform", href: "#platform" },
  { name: "For Schools", href: "#audiences" },
  { name: "Privacy", href: "/" },
  { name: "Contact", href: "/" },
];

function PillButton({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full transition-colors duration-200";
  const styles =
    variant === "solid"
      ? "bg-indigo text-white hover:bg-[#313560]"
      : "border border-indigo text-indigo hover:bg-indigo-5";

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

function AudienceButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="hover-lift inline-flex h-11 w-full items-center justify-center rounded-[12px] border border-indigo text-[14px] font-semibold leading-[21px] text-indigo transition-colors duration-200 hover:bg-indigo-5"
    >
      {children}
    </Link>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const year = new Date().getFullYear();
  const ctaTypingStyle = { "--type-characters": 31 } as CSSProperties;
  const heroTypingStyle = { "--type-characters": 24 } as CSSProperties;

  return (
    <div className="bg-parchment text-graphite">
      <div className="mx-auto flex w-full max-w-[1024px] flex-col">
        <header className="flex h-16 items-center justify-between px-6 md:px-12">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label="Nevo home" className="shrink-0 hover-lift">
              <NevoLogo width={73} height={22} />
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="hover-lift text-[14px] font-medium leading-[21px] text-graphite transition-opacity duration-200 hover:opacity-70"
                >
                  {link.name}
                </a>
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

        <main className="flex flex-col">
          <section className="px-6 pb-16 pt-12 md:px-12 md:pb-[72px] md:pt-12">
            <div className="flex flex-col items-center gap-10">
              <div className="flex w-full max-w-[560px] flex-col items-center">
                <Reveal delay={60}>
                  <p
                    style={heroTypingStyle}
                    className="animate-typewriter mb-5 text-center text-[13px] font-semibold uppercase tracking-[0.22em] text-indigo/70 md:text-[14px]"
                  >
                    Designed around the learner
                  </p>
                </Reveal>
                <Reveal delay={180}>
                  <h1 className="text-center text-[36px] font-bold leading-[1.08] md:text-[44px] md:leading-[48px]">
                    Learning, your way.
                  </h1>
                </Reveal>
                <Reveal delay={300}>
                  <p className="pt-5 text-center text-[16px] leading-[26px] opacity-90 md:text-[17px] md:leading-[27px]">
                    Nevo is an adaptive learning platform designed around how each
                    learner focuses, progresses, and builds confidence. It supports
                    stronger learning without forcing every student into the same path.
                  </p>
                </Reveal>
                <Reveal delay={420} className="pt-6">
                  <PillButton
                    href="/auth"
                    className="animate-pulse-glow hover-lift h-[52px] px-7 text-[16px] font-semibold leading-6 md:w-[146px]"
                  >
                    Get Started
                  </PillButton>
                </Reveal>
              </div>

              <Reveal delay={540} className="w-full">
                <div className="relative w-full overflow-hidden rounded-[20px]">
                  <Image
                    src="/image.png"
                    alt="Student using Nevo on a tablet"
                    width={1856}
                    height={840}
                    priority
                    className="h-auto w-full rounded-[20px] object-cover"
                  />
                </div>
              </Reveal>
            </div>
          </section>

          <section
            id="audiences"
            className="px-6 py-18 md:px-12 md:py-[72px]"
          >
            <Reveal>
              <h2 className="text-center text-[26px] font-bold leading-[39px]">
                Choose how you want to use Nevo
              </h2>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-5 md:mt-[44px] md:grid-cols-3 md:gap-5">
              {audienceCards.map((card, index) => (
                <Reveal
                  key={card.title}
                  delay={120 + index * 120}
                >
                  <article className="hover-lift flex min-h-[350px] flex-col rounded-[20px] bg-white p-[29px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
                    <div className="pb-5">
                      <Image
                        src={card.icon}
                        alt=""
                        width={36}
                        height={54}
                        className="animate-soft-bounce h-[54px] w-[36px] object-contain"
                      />
                    </div>
                    <h3 className="pb-4 text-[17px] font-bold leading-[26px]">
                      {card.title}
                    </h3>
                    <p className="pb-7 text-[14px] leading-[21px] text-graphite/80">
                      {card.description}
                    </p>
                    <div className="mt-auto">
                      <AudienceButton href={card.href}>{card.cta}</AudienceButton>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section
            id="platform"
            className="px-6 py-18 md:px-12 md:py-[72px]"
          >
            <Reveal>
              <h2 className="text-center text-[30px] font-bold leading-[1.2] md:text-[32px] md:leading-[48px]">
                Designed for minds, not averages.
              </h2>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-12 md:mt-[80px] md:grid-cols-3 md:gap-8">
              {principles.map((item, index) => (
                <Reveal
                  key={item.title}
                  delay={120 + index * 120}
                >
                  <article className="flex flex-col items-center text-center">
                    <div className="animate-soft-bounce mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-lavender-20">
                      {item.icon}
                    </div>
                    <h3 className="pb-3 text-[17px] font-semibold leading-[26px]">
                      {item.title}
                    </h3>
                    <p className="max-w-[272px] text-[14px] leading-[21px] text-graphite/80">
                      {item.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section
            id="insights"
            className="px-6 py-18 md:px-12 md:py-[72px]"
          >
            <Reveal>
              <h2 className="text-center text-[32px] font-bold leading-[39px]">
                How Nevo works
              </h2>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-8 md:mt-[56px] md:grid-cols-3 md:gap-[28px]">
              {howItWorks.map((item, index) => (
                <Reveal
                  key={item.title}
                  delay={120 + index * 120}
                >
                  <article className="flex flex-col gap-5">
                    {item.illustration}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-[17px] font-bold leading-[26px]">
                        {item.title}
                      </h3>
                      <p className="text-[14px] leading-[21px] text-graphite/80">
                        {item.description}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section
            id="about"
            className="px-6 py-18 md:px-12 md:py-[88px]"
          >
            <div className="mx-auto flex max-w-[700px] flex-col items-center gap-7">
              <Reveal>
                <h2 className="text-center text-[32px] font-bold leading-[39px]">
                  Nevo is not another rigid edtech tool.
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="text-center text-[18px] font-medium leading-[30px] md:text-[22px] md:leading-[35px]">
                  Nevo is built to reduce stress, improve clarity, and support
                  meaningful progress for every kind of learner, especially those too
                  often overlooked by traditional systems.
                </p>
              </Reveal>
            </div>
          </section>

          <section className="px-6 py-18 md:px-12 md:py-[72px]">
            <Reveal>
              <div className="relative overflow-hidden rounded-[28px] bg-lavender-10 px-6 py-12 md:px-[78px] md:py-[52px]">
                <div className="animate-float-gentle absolute -left-14 -top-14 h-28 w-28 rounded-full bg-white/40 blur-[24px]" />
                <div className="animate-float-gentle absolute bottom-[-53px] right-[-28px] h-40 w-40 rounded-full bg-indigo/5 blur-[40px]" />

                <div className="relative flex flex-col items-center">
                  <h2 className="text-center text-[30px] font-bold leading-[1.2] md:text-[38px] md:leading-[57px]">
                    Start with one learner. See what changes.
                  </h2>
                  <div className="pt-7">
                    <PillButton
                      href="/auth"
                      className="animate-pulse-glow hover-lift h-[52px] px-10 text-[16px] font-semibold leading-6 md:w-[170px]"
                    >
                      Get Started
                    </PillButton>
                  </div>
                  <p
                    style={ctaTypingStyle}
                    className="animate-typewriter pt-5 text-center text-[14px] font-medium leading-[21px] text-graphite/60"
                  >
                    Built for students, teachers, and schools.
                  </p>
                </div>
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="border-t border-graphite/5 px-6 py-12 md:px-12 md:pb-[52px] md:pt-[53px]">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-8">
              <div className="flex flex-col gap-4">
                <Link href="/" aria-label="Nevo home" className="hover-lift w-fit">
                  <NevoLogo width={73} height={22} />
                </Link>
                <p className="text-[13px] leading-5 text-graphite/60">Learning, your way.</p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4 md:gap-x-12 md:gap-y-4">
                {footerLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-[13px] font-medium leading-5 text-graphite transition-opacity duration-200 hover:opacity-70"
                  >
                    {link.name}
                  </a>
                ))}
              </div>
            </div>

            <p className="text-[13px] leading-5 text-graphite/40">
              {"\u00A9"} Nevo {year}. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AdaptiveIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M3.5 9.5H11.0833"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M16.9167 9.5H24.5"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M3.5 18.5H8.75"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M14.5833 18.5H24.5"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="14" cy="9.5" r="2.91667" stroke="#3B3F6E" strokeWidth="1.75" />
      <circle cx="11.6667" cy="18.5" r="2.91667" stroke="#3B3F6E" strokeWidth="1.75" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M23.3333 4.66663C15.1667 4.66663 8.16667 9.56663 5.83334 16.3333C4.72611 19.5447 5.89181 23.0969 8.91668 23.9166C15.6833 25.75 22.1667 19.8333 23.3333 13.4166C23.8 10.85 23.8 7.93329 23.3333 4.66663Z"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 14.5833C12.8333 14.5833 15.1667 15.1667 17.5 16.9167"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12.8333 23.3333C13.4167 19.8333 14.5833 17.5 17.5 14.5833"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClassroomIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 7.58337C15.933 7.58337 17.5 6.01637 17.5 4.08337C17.5 2.15038 15.933 0.583374 14 0.583374C12.067 0.583374 10.5 2.15038 10.5 4.08337C10.5 6.01637 12.067 7.58337 14 7.58337Z"
        transform="translate(0 4)"
        stroke="#3B3F6E"
        strokeWidth="1.75"
      />
      <path
        d="M4.08334 20.4167V18.0834C4.08334 15.505 6.17168 13.4167 8.75001 13.4167H10.5C13.0783 13.4167 15.1667 15.505 15.1667 18.0834V20.4167"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M17.5 18.0834V16.9167C17.5 14.9837 19.067 13.4167 21 13.4167H21.5833C23.5163 13.4167 25.0833 14.9837 25.0833 16.9167V18.0834"
        stroke="#3B3F6E"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M6.41666 10.5C7.70532 10.5 8.74999 9.45537 8.74999 8.16671C8.74999 6.87804 7.70532 5.83337 6.41666 5.83337C5.12799 5.83337 4.08333 6.87804 4.08333 8.16671C4.08333 9.45537 5.12799 10.5 6.41666 10.5Z"
        stroke="#3B3F6E"
        strokeWidth="1.75"
      />
      <path
        d="M21.5833 10.5C22.872 10.5 23.9167 9.45537 23.9167 8.16671C23.9167 6.87804 22.872 5.83337 21.5833 5.83337C20.2947 5.83337 19.25 6.87804 19.25 8.16671C19.25 9.45537 20.2947 10.5 21.5833 10.5Z"
        stroke="#3B3F6E"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function OnboardingIllustration() {
  return (
    <svg
      viewBox="0 0 295 184"
      className="h-auto w-full rounded-[20px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g filter="url(#onboardingShadow)">
        <path
          d="M2 21C2 9.9543 10.9543 1 22 1H272.656C283.702 1 292.656 9.95431 292.656 21V161C292.656 172.046 283.702 181 272.656 181H22C10.9543 181 2 172.046 2 161V21Z"
          fill="#FCFCFC"
        />
        <path
          d="M77.3281 50C82.2987 50 86.3281 54.0294 86.3281 59C86.3281 63.9706 82.2987 68 77.3281 68C72.3576 68 68.3281 63.9706 68.3281 59C68.3281 54.0294 72.3576 50 77.3281 50Z"
          stroke="#3B3F6E"
          strokeWidth="2"
        />
        <path
          d="M72.3281 59C72.3281 56.2386 74.5667 54 77.3281 54C80.0895 54 82.3281 56.2386 82.3281 59C82.3281 61.7614 80.0895 64 77.3281 64C74.5667 64 72.3281 61.7614 72.3281 59Z"
          fill="#3B3F6E"
        />
        <path
          d="M99.3281 59C99.3281 56.7909 101.119 55 103.328 55H175.328C177.537 55 179.328 56.7909 179.328 59C179.328 61.2091 177.537 63 175.328 63H103.328C101.119 63 99.3281 61.2091 99.3281 59Z"
          fill="#F3F4F6"
        />
        <g opacity="0.5">
          <path
            d="M77.3281 82C82.2987 82 86.3281 86.0294 86.3281 91C86.3281 95.9706 82.2987 100 77.3281 100C72.3576 100 68.3281 95.9706 68.3281 91C68.3281 86.0294 72.3576 82 77.3281 82Z"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <path
            d="M99.3281 91C99.3281 88.7909 101.119 87 103.328 87H151.328C153.537 87 155.328 88.7909 155.328 91C155.328 93.2091 153.537 95 151.328 95H103.328C101.119 95 99.3281 93.2091 99.3281 91Z"
            fill="#F3F4F6"
          />
        </g>
        <g opacity="0.3">
          <path
            d="M77.3281 114C82.2987 114 86.3281 118.029 86.3281 123C86.3281 127.971 82.2987 132 77.3281 132C72.3576 132 68.3281 127.971 68.3281 123C68.3281 118.029 72.3576 114 77.3281 114Z"
            stroke="#D1D5DB"
            strokeWidth="2"
          />
          <path
            d="M99.3281 123C99.3281 120.791 101.119 119 103.328 119H159.328C161.537 119 163.328 120.791 163.328 123C163.328 125.209 161.537 127 159.328 127H103.328C101.119 127 99.3281 125.209 99.3281 123Z"
            fill="#F3F4F6"
          />
        </g>
      </g>
      <defs>
        <filter
          id="onboardingShadow"
          x="0"
          y="0"
          width="294.656"
          height="184"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function AdaptIllustration() {
  return (
    <svg
      viewBox="0 0 295 184"
      className="h-auto w-full rounded-[20px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g filter="url(#adaptShadow)">
        <path
          d="M2 21C2 9.9543 10.9543 1 22 1H272.672C283.718 1 292.672 9.95431 292.672 21V161C292.672 172.046 283.718 181 272.672 181H22C10.9543 181 2 172.046 2 161V21Z"
          fill="#FCFCFC"
        />
        <path
          d="M51.3359 48C51.3359 41.3726 56.7085 36 63.3359 36H129.336C135.963 36 141.336 41.3726 141.336 48V134C141.336 140.627 135.963 146 129.336 146H63.3359C56.7085 146 51.3359 140.627 51.3359 134V48Z"
          fill="#F7F1E6"
        />
        <path
          d="M63.3359 36.5H129.336C135.687 36.5 140.836 41.6487 140.836 48V134C140.836 140.351 135.687 145.5 129.336 145.5H63.3359C56.9847 145.5 51.8359 140.351 51.8359 134V48C51.8359 41.6487 56.9847 36.5 63.3359 36.5Z"
          stroke="#9A9CCB"
          strokeOpacity="0.3"
        />
        <path
          d="M64.3359 57C64.3359 52.5817 67.9177 49 72.3359 49H84.3359C88.7542 49 92.3359 52.5817 92.3359 57V69C92.3359 73.4183 88.7542 77 84.3359 77H72.3359C67.9177 77 64.3359 73.4183 64.3359 69V57Z"
          fill="#FCFCFC"
        />
        <path
          d="M64.3359 89C64.3359 86.7909 66.1268 85 68.3359 85H124.336C126.545 85 128.336 86.7909 128.336 89C128.336 91.2091 126.545 93 124.336 93H68.3359C66.1268 93 64.3359 91.2091 64.3359 89Z"
          fill="#FCFCFC"
        />
        <path
          d="M64.3359 105C64.3359 102.791 66.1268 101 68.3359 101H102.992C105.201 101 106.992 102.791 106.992 105C106.992 107.209 105.201 109 102.992 109H68.3359C66.1268 109 64.3359 107.209 64.3359 105Z"
          fill="#FCFCFC"
        />
        <path
          d="M153.336 48C153.336 41.3726 158.709 36 165.336 36H231.336C237.963 36 243.336 41.3726 243.336 48V134C243.336 140.627 237.963 146 231.336 146H165.336C158.709 146 153.336 140.627 153.336 134V48Z"
          fill="#3B3F6E"
          fillOpacity="0.05"
        />
        <path
          d="M165.336 36.5H231.336C237.687 36.5 242.836 41.6487 242.836 48V134C242.836 140.351 237.687 145.5 231.336 145.5H165.336C158.985 145.5 153.836 140.351 153.836 134V48C153.836 41.6487 158.985 36.5 165.336 36.5Z"
          stroke="#3B3F6E"
          strokeOpacity="0.1"
        />
        <path
          d="M205.336 82H191.336C190.231 82 189.336 82.8954 189.336 84V98C189.336 99.1046 190.231 100 191.336 100H205.336C206.441 100 207.336 99.1046 207.336 98V84C207.336 82.8954 206.441 82 205.336 82Z"
          stroke="#3B3F6E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M189.336 88H207.336"
          stroke="#3B3F6E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M195.336 100V88"
          stroke="#3B3F6E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <filter
          id="adaptShadow"
          x="0"
          y="0"
          width="294.672"
          height="184"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}

function ProgressIllustration() {
  return (
    <svg
      viewBox="0 0 295 184"
      className="h-auto w-full rounded-[20px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g filter="url(#progressShadow)">
        <path
          d="M2 21C2 9.9543 10.9543 1 22 1H272.656C283.702 1 292.656 9.95431 292.656 21V161C292.656 172.046 283.702 181 272.656 181H22C10.9543 181 2 172.046 2 161V21Z"
          fill="#FCFCFC"
        />
        <path
          d="M50.0156 114.203C50.0156 109.785 53.5973 106.203 58.0156 106.203H84.6719C89.0902 106.203 92.6719 109.785 92.6719 114.203V141H50.0156V114.203Z"
          fill="#3B3F6E"
          fillOpacity="0.2"
        />
        <path
          d="M100.672 91C100.672 86.5817 104.254 83 108.672 83H135.328C139.746 83 143.328 86.5817 143.328 91V141H100.672V91Z"
          fill="#3B3F6E"
          fillOpacity="0.4"
        />
        <path
          d="M151.328 102.609C151.328 98.1911 154.91 94.6094 159.328 94.6094H185.984C190.403 94.6094 193.984 98.1911 193.984 102.609V141H151.328V102.609Z"
          fill="#3B3F6E"
          fillOpacity="0.6"
        />
        <path
          d="M201.984 62C201.984 57.5817 205.566 54 209.984 54H236.641C241.059 54 244.641 57.5817 244.641 62V141H201.984V62Z"
          fill="#3B3F6E"
        />
        <path
          d="M201.484 30C201.484 27.7909 203.275 26 205.484 26H242.484C244.694 26 246.484 27.7909 246.484 30V45C246.484 47.2091 244.694 49 242.484 49H205.484C203.275 49 201.484 47.2091 201.484 45V30Z"
          fill="#2B2B2F"
        />
        <text
          x="223.8"
          y="40.6"
          fill="#FCFCFC"
          fontSize="10"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
        >
          Good!
        </text>
      </g>
      <defs>
        <filter
          id="progressShadow"
          x="0"
          y="0"
          width="294.656"
          height="184"
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
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  );
}
