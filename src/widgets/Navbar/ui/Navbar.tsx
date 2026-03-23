'use client'

import Image from "next/image";
import logo from "@/shared/assets/default-logo.svg";
import { NavLinks } from "@/shared/lib";

export function Navbar({ ctaText = "Sign in", onCtaClick, ctaLink = "/login" }: { ctaText?: string, onCtaClick?: () => void, ctaLink?: string } = {}) {
    return (
        <nav className="flex px-6 sm:px-12 xl:px-20 py-4 xl:py-5.5 items-center justify-between w-full">
            <div className="flex items-center justify-start xl:justify-center xl:space-x-10">
                <Image src={logo} alt="logo" width={100} height={100} className="w-20 xl:w-[100px] h-auto" />
                <ul className="hidden xl:flex items-center justify-center space-x-10">
                    {NavLinks.map((link) => {
                        return (
                            <li key={link.name} className="capitalize cursor-pointer font-medium text-graphite"> <a href={link.url}></a> {link.name} </li>
                        )
                    })}
                </ul>
            </div>
            {onCtaClick ? (
                <button onClick={onCtaClick} className="border border-indigo rounded-full px-5 xl:px-8 py-2 xl:py-3 text-sm xl:text-base font-medium cursor-pointer whitespace-nowrap">{ctaText}</button>
            ) : (
                <a href={ctaLink} className="border border-indigo rounded-full px-5 xl:px-8 py-2 xl:py-3 text-sm xl:text-base font-medium cursor-pointer whitespace-nowrap flex items-center">{ctaText}</a>
            )}
        </nav>
    )
}