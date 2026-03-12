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
import { WaitlistForm, WaitlistConfirmation } from "@/features/Waitlist";
import { MiniFooter } from "@/widgets";

export default function WaitlistPage() {
    const [currentImage, setCurrentImage] = useState(ctaLanding);
    const [imageSize, setImageSize] = useState({
        width: 608,
        height: 600
    });

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

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

    const handleJoinClick = () => {
        setIsFormVisible(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    if (isFormVisible) {
        return (
            <div>
                {!isRegistered ? (
                    <WaitlistForm onSuccess={() => setIsRegistered(true)} />
                ) : (
                    <WaitlistConfirmation />
                )}
            </div>
        )
    }

    return (
        <div className="bg-parchment">
            <Navbar ctaText="Join the waitlist" onCtaClick={handleJoinClick} />

            <main className="xl:px-20 px-6 sm:px-12">

                <section id="cta" className="flex xl:pt-[110px] pt-12 xl:pb-[130px] pb-14 gap-10 xl:gap-0 flex-col xl:flex-row items-center justify-between w-full">
                    <div className="text-container flex flex-col xl:gap-7.75 gap-6 xl:items-start items-center justify-center xl:max-w-150 leading-[1.1] w-full">
                        <h1 className="xl:text-6-5xl text-44px font-bold text-center xl:text-left">Learning, your way.</h1>
                        <p className="xl:text-xl text-17px xl:text-start text-center leading-[1.6] max-w-full xl:max-w-125">Nevo is a calm, adaptive learning platform built around how each mind learns, focuses, and progresses — not around rigid systems.</p>
                        <ActionButton name="Join the waitlist" onClick={handleJoinClick} type="button" className="cursor-pointer" />
                    </div>
                    <div className="image-container w-full flex justify-center xl:justify-end">
                        <Image src={currentImage} alt="cta-landing" width={imageSize.width} height={imageSize.height} className="rounded-4xl w-full max-w-[608px] xl:max-w-[928px] h-auto object-contain" />
                    </div>
                </section>

                <section id="path" className="xl:py-25 py-18 flex items-center flex-col xl:space-y-15 space-y-11 w-full">
                    <h2 className="xl:font-agile xl:text-regular text-center font-bold text-[26px] xl:text-3-4xl">Choose how you want to use Nevo</h2>
                    <div className="flex flex-col xl:flex-row items-center justify-center xl:justify-center gap-6 xl:gap-8 w-full">
                        {pathLinks.map((link) => {
                            return (
                                <div key={link.path} className="bg-white w-full max-w-[405px] flex flex-col items-center justify-between min-h-[350px] xl:h-95 p-7.25 xl:p-8.25 rounded-20px xl:rounded-3xl">
                                    <div className="flex flex-col items-center text-center">
                                        <Icon type={link.icon} width={40} height={60} className="w-[36px] h-[54px] xl:w-[40px] xl:h-[60px] mb-6" />
                                        <h3 className="font-bold xl:text-2xl text-17px pb-4">{link.path}</h3>
                                        <p className="xl:text-base text-sm text-graphite-80">{link.desc}</p>
                                    </div>
                                    <ActionButton name={`I am joining as a ${link.name}`} onClick={handleJoinClick} type="transparent" className="px-4 cursor-pointer mt-6 xl:px-6 rounded-xl py-3 xl:text-base text-sm w-full h-auto min-h-[48px] flex items-center justify-center" />
                                </div>
                            )
                        })}
                    </div>
                </section>

                <section id="features" className="xl:py-25 py-18 flex flex-col xl:gap-20 gap-14 items-center justify-center w-full">
                    <h2 className="font-bold xl:text-40px text-3-4xl text-center">Designed for minds, not averages.</h2>
                    <ul className="flex flex-col xl:flex-row items-center xl:items-start xl:gap-12 gap-10 w-full justify-center">
                        {features.map((feat) => {
                            return (
                                <li key={feat.header} className="w-full max-w-[301px] flex flex-col items-center justify-center text-center">
                                    <div className="xl:p-6 p-5.5 rounded-full bg-lavender-20 w-fit mb-6">
                                        <Icon type={feat.icon} width={32} height={32} className="w-7 h-7 xl:w-9 xl:h-9" />
                                    </div>
                                    <p className="mb-3 font-semibold text-17px xl:text-xl"> {feat.header} </p>
                                    <p className="text-sm xl:text-base"> {feat.desc} </p>
                                </li>
                            )
                        })}
                    </ul>
                </section>

                <section id="works" className="flex flex-col xl:py-25 py-18 items-center justify-center xl:gap-20 gap-14 w-full">
                    <h2 className="font-bold text-3-4xl text-center">How Nevo Works</h2>
                    <ul className="flex flex-col xl:flex-row xl:items-stretch gap-10 xl:gap-10 w-full justify-center">
                        {works.map((work) => {
                            return (
                                <li className="flex flex-1 w-full max-w-[400px] flex-col gap-5 xl:gap-6 mx-auto" key={work.header}>
                                    <div className="image w-full flex justify-center">
                                        <Image src={work.icon} alt="Illustration" width={400} height={200} className="w-full h-auto aspect-2/1 object-cover rounded-xl" />
                                    </div>
                                    <div className="flex flex-col gap-2 text-center xl:text-left">
                                        <p className="font-bold text-17px xl:text-xl">{work.header}</p>
                                        <p className="text-sm xl:text-base">{work.desc}</p>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </section>

                <section id="info" className="flex flex-col items-center justify-center gap-7 xl:gap-8 py-22 xl:py-30 w-full">
                    <h2 className="font-bold text-3-4xl text-center">Nevo is not another rigid edtech tool.</h2>
                    <p className="font-medium max-w-[797px] w-full text-center text-[22px] xl:text-28px">Nevo is built to reduce stress, increase clarity, and support learning for every kind of mind — especially those often left behind by traditional systems.</p>
                </section>

                <section className="xl:py-25 py-18 w-full" id="action">
                    <div className="bg-lavender-10 flex flex-col items-center justify-center rounded-[28px] xl:rounded-4xl py-13 xl:py-16 px-6 text-center">
                        <p className="font-bold text-[38px] xl:text-5xl mb-7 xl:mb-8 leading-[1.2]">Start with one learner.<br className="xl:hidden" /> See what changes.</p>
                        <ActionButton name="Join the waitlist" onClick={handleJoinClick} className="mb-6 text-base cursor-pointer px-8" type="button" />
                        <p className="xl:font-semibold font-medium xl:text-base text-sm text-graphite-60">Student, teacher, or school — Nevo meets you where you are.</p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
