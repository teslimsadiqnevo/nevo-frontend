'use client';

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import authImg from "@/shared/assets/auth-ill.png";
import { ActionButton, Icon, type IconType } from "@/shared/ui";

type Mode = "create" | "signin" | null;
type RoleKey = "student" | "teacher" | "school";

type RoleOption = {
  key: RoleKey;
  label: string;
  icon: IconType;
  createHref: string;
  signinHref: string;
};

const roleOptions: RoleOption[] = [
  {
    key: "student",
    label: "I'm a Student",
    icon: "student-icon-II",
    createHref: "/register/student",
    signinHref: "/login/student",
  },
  {
    key: "teacher",
    label: "I'm a Teacher",
    icon: "teacher-icon-II",
    createHref: "/register/teacher",
    signinHref: "/login/teacher",
  },
  {
    key: "school",
    label: "My School",
    icon: "school-icon-II",
    createHref: "/register/school",
    signinHref: "/login/school",
  },
];

export default function GetStarted() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pressedRole, setPressedRole] = useState<RoleKey | null>(null);

  const mode = useMemo<Mode>(() => {
    const value = searchParams.get("mode");
    if (value === "create" || value === "signin") return value;
    return null;
  }, [searchParams]);

  const isRoleSelection = mode === "create" || mode === "signin";

  const handleRoleSelect = (role: RoleOption) => {
    setPressedRole(role.key);
    const href = mode === "signin" ? role.signinHref : role.createHref;
    window.setTimeout(() => {
      router.push(href);
    }, 120);
  };

  if (!isRoleSelection) {
    return (
      <div className="min-h-screen bg-parchment text-graphite">
        <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment">
          <div className="h-20 shrink-0" />

          <main className="flex flex-1 flex-col">
            <section className="flex justify-center px-6 md:px-12">
              <div className="w-full max-w-[320px] rounded-2xl bg-parchment">
                <Image
                  src={authImg}
                  alt="Nevo welcome illustration"
                  width={320}
                  height={240}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </section>

            <section className="px-6 pb-8 pt-8 md:px-12">
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-[26px] font-bold leading-[39px] text-indigo">
                  Learning, your way.
                </h1>
                <p className="max-w-[350px] text-[15px] font-normal leading-[22px] text-black/65">
                  A learning experience built around how you think.
                </p>
              </div>
            </section>

            <section className="px-6 pb-12 pt-8 md:px-12">
              <div className="flex flex-col gap-3">
                <ActionButton
                  link="/auth?mode=create"
                  name="Create an account"
                  className="w-full cursor-pointer rounded-xl py-3.5 text-base transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#313560] hover:shadow-[0_10px_24px_rgba(59,63,110,0.16)]"
                />
                <ActionButton
                  link="/auth?mode=signin"
                  name="Sign in"
                  type="transparent"
                  className="w-full cursor-pointer rounded-xl py-3.5 text-base transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-5 hover:shadow-[0_10px_24px_rgba(59,63,110,0.08)]"
                />
              </div>
            </section>

            <div className="mt-auto flex flex-col items-center gap-6 px-6 pb-10 pt-8 md:px-12">
              <p className="text-center text-xs leading-4 text-black/40">
                By continuing, you agree to Nevo&apos;s Terms and Privacy Policy.
              </p>
              <div className="h-[5px] w-[134px] rounded-full bg-black/30" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const headline = mode === "create" ? "Who are you?" : "Welcome back";
  const subline =
    mode === "create"
      ? "Choose your role to get started."
      : "Select your role to sign in.";

  return (
    <div className="min-h-screen bg-parchment text-graphite">
      <div className="mx-auto flex min-h-screen w-full max-w-[1024px] flex-col bg-parchment">
        <header className="h-[84px] shrink-0">
          <button
            type="button"
            onClick={() => router.push("/auth")}
            aria-label="Back"
            className="ml-8 mt-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-indigo transition-colors hover:bg-indigo-5"
          >
            <Icon type="back" width={24} height={24} className="h-6 w-6" />
          </button>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="px-6 pt-10 md:px-12">
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="text-[22px] font-bold leading-[33px] text-indigo">
                {headline}
              </h1>
              <p className="text-[14px] font-normal leading-[21px] text-graphite/60">
                {subline}
              </p>
            </div>
          </section>

          <section className="px-6 pb-16 pt-20 md:px-6">
            <div className="flex flex-col gap-3">
              {roleOptions.map((role) => {
                const selected = pressedRole === role.key;

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    onMouseDown={() => setPressedRole(role.key)}
                    onMouseUp={() => setPressedRole(null)}
                    onMouseLeave={() => setPressedRole(null)}
                    onTouchStart={() => setPressedRole(role.key)}
                    className={`flex h-20 w-full items-center justify-between rounded-xl px-5 text-left transition-all duration-150 ${
                      selected
                        ? "border-2 border-indigo bg-indigo-5"
                        : "border border-[#E0D9CE] bg-parchment"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Icon
                        type={role.icon}
                        width={28}
                        height={28}
                        className="h-7 w-7 opacity-90"
                      />
                      <span className="text-[16px] font-semibold leading-6 text-indigo">
                        {role.label}
                      </span>
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className={selected ? "opacity-100" : "opacity-40"}
                    >
                      <path
                        d="M6 3L10.5 8L6 13"
                        stroke="#3B3F6E"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="mt-auto px-8 pb-8 pt-6">
            <div className="mx-auto flex max-w-[160px] items-center justify-center">
              <div className="h-[5px] w-[134px] rounded-full bg-black/25" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
