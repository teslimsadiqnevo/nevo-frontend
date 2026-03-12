'use client'

import Image from "next/image";
import logo from "@/shared/assets/default-logo.svg";
import { NavLinks } from "@/shared/lib";

export function Navbar({ ctaText = "Sign in", onCtaClick, ctaLink = "/register/assessment" }: { ctaText?: string, onCtaClick?: () => void, ctaLink?: string } = {}) {
    return (
        <nav className="flex px-20 py-5.5 items-center justify-between">
            <div className="flex items-center justify-center space-x-10">
                <Image src={logo} alt="logo" width={100} height={100} />
                <ul className="flex items-center justify-center space-x-10">
                    {NavLinks.map((link) => {
                        return (
                            <li key={link.name} className="capitalize cursor-pointer font-medium text-graphite"> <a href={link.url}></a> {link.name} </li>
                        )
                    })}
                </ul>
            </div>
            {onCtaClick ? (
                <button onClick={onCtaClick} className="border border-indigo rounded-full px-8 py-3 font-medium cursor-pointer">{ctaText}</button>
            ) : (
                <a href={ctaLink} className="border border-indigo rounded-full px-8 py-3 font-medium cursor-pointer">{ctaText}</a>
            )}
        </nav>
    )
}