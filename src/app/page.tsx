'use client'

import { Navbar } from "@/widgets";
import Image from "next/image";
import ctaLanding from "@/shared/assets/landing-cta.png"
import mobileCtaLanding from "@/shared/assets/landing-cta-mobile.png"
import { pathLinks, works } from "@/shared/lib";
import { features } from "@/shared/lib";
import { ActionButton, Icon } from "@/shared/ui";
import { Footer } from "@/widgets";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentImage, setCurrentImage] = useState(ctaLanding);
  const [imageSize, setImageSize] = useState({
    width: 608,
    height: 600
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setCurrentImage(e.matches ? mobileCtaLanding : ctaLanding);
      setImageSize(e.matches ? { width: 928, height: 658 } : { width: 608, height: 600 });
    };
    handleChange(mq);
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  return (
    <div className="bg-parchment">
      <Navbar />

      <main className="xl:px-20 px-12">

        <section id="cta" className="flex xl:pt-[110px] pt-12 xl:pb-[130px] pb-14 gap-10 xl:gap-0 flex-col xl:flex-row items-center justify-between ">
          <div className="text-container flex flex-col xl:gap-7.75 gap-6 xl:items-start items-center justify-center xl:max-w-150 leading-[1.1]">
            <h1 className="xl:text-6-5xl text-44px font-bold">Learning, your way.</h1>
            <p className="xl:text-xl text-17px xl:text-start text-center leading-[1.6] max-w-125">Nevo is a calm, adaptive learning platform built around how each mind learns, focuses, and progresses — not around rigid systems.</p>
            <ActionButton link="/" rounded name="Get Started" />
          </div>
          <div className="image-container">
            <Image src={currentImage} alt="cta-landing" width={imageSize.width} height={imageSize.height} className="rounded-4xl" />
          </div>
        </section>

        <section id="path" className="xl:py-25 py-18 flex items-center flex-col xl:space-y-15 space-y-11">
          <h2 className="xl:font-agile xl:text-regular font-bold text-[26px] xl:text-3-4xl">Choose how you want to use Nevo</h2>
          <div className="flex items-center justify-between gap-5 xl:gap-8">
            {pathLinks.map((link) => {
              return (
                <div key={link.path} className="bg-white xl:w-[405] w-[300px] flex flex-col items-center justify-between xl:h-95 h-[350px] p-7.25 xl:p-8.25 rounded-20px xl:rounded-3xl">
                  <div className="">

                    <Icon type={link.icon} width={40} height={60} className="w-[36px] h-[54px] xl:w-[40px] xl:h-[60px] mb-6" />
                    <h3 className="font-bold xl:text-2xl text-17px pb-4">{link.path}</h3>
                    <p className="xl:text-base text-sm text-graphite-80">{link.desc}</p>
                  </div>
                  <ActionButton link="/" name={`Continue as ${link.name}`} type="transparent" className="px-12.25 rounded-xl xl:px-[85px] py-3 xl:text-base text-sm w-full" />
                </div>
              )
            })}
          </div>
        </section>

        <section id="features" className="xl:py-25 py-18 flex flex-col xl:gap-20 gap-14 items-center justify-center">
          <h2 className="font-bold xl:text-40px text-3-4xl">Designed for minds, not averages.</h2>
          <ul className="flex items-center xl:gap-12 gap-8">
            {features.map((feat) => {
              return (
                <li key={feat.header} className="xl:w-[301px] w-68 flex flex-col items-center justify-center">
                  <div className="xl:p-6 p-5.5 rounded-full bg-lavender-20 w-fit mb-6">
                    <Icon type={feat.icon} width={32} height={32} className="w-7 h-7 xl:w-9 xl:h-9" />
                  </div>
                  <p className="mb-3 font-semibold text-17px xl:text-xl"> {feat.header} </p>
                  <p className="text-center text-sm xl:text-base"> {feat.desc} </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section id="works" className="flex flex-col xl:py-25 py-18 items-center justify-center xl:gap-20 gap-14">
          <h2 className="font-bold text-3-4xl">How Nevo Works</h2>
          <ul className="flex gap-7 xl:gap-10">
            {works.map((work) => {
              return (
                <li className="flex flex-1 xl:w-100 w-73 xl:h-78.5 h-74 flex-col gap-5 xl:gap-6" key={work.header}>
                  <div className="image">
                    <Image src={work.icon} alt="Illustration" width={400} height={200} className="xl:w-100 xl:h-50 w-72.5 h-45" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="font-bold text-17px xl:text-xl">{work.header}</p>
                    <p className="text-sm xl:text-base">{work.desc}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section id="info" className="flex flex-col items-center justify-center gap-7 xl:gap-8 py-22 xl:py-30">
          <h2 className="font-bold text-3-4xl">Nevo is not another rigid edtech tool.</h2>
          <p className="font-medium w-[797px] text-center text-[22px] xl:text-28px">Nevo is built to reduce stress, increase clarity, and support learning for every kind of mind — especially those often left behind by traditional systems.</p>
        </section>

        <section className="xl:py-25 py-18" id="action">
          <div className="bg-lavender-10 flex flex-col items-center justify-center rounded-[28px] xl:rounded-4xl py-13 xl:py-16">
            <p className="font-bold text-[38px] xl:text-5xl mb-7 xl:mb-8">Start with one learner. See what changes.</p>
            <ActionButton link="/" rounded name="Get Started" className="mb-6 text-base" />
            <p className="xl:font-semibold font-medium xl:text-base text-sm text-graphite-60">Student, teacher, or school — Nevo meets you where you are.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}