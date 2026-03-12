import { FooterLinks } from "@/shared/lib";

export function Footer() {
    let year = new Date().getFullYear();
    return (
        <div className="border-t text-sm xl:py-15 py-10 xl:px-20 px-6 sm:px-12 border-graphite-5 flex flex-col xl:gap-16 gap-10">
            <div className="flex flex-col xl:flex-row xl:items-center items-start justify-between gap-10 xl:gap-0">
                <div className="flex flex-col gap-2 xl:gap-4 items-start justify-center">
                    <p className="font-agile text-xl xl:text-2xl">Nevo</p>
                    <p className="text-graphite-60 xl:text-base text-sm">Learning, your way.</p>
                </div>
                <ul className="grid grid-cols-2 gap-x-12 xl:gap-x-12 gap-y-4 xl:gap-y-3 w-full xl:w-auto">
                    {FooterLinks.map((link) => {
                        return (
                            <li className="capitalize font-medium xl:text-base text-sm" key={link.name}> <a href={link.url}> {link.name} </a> </li>
                        )
                    })}
                </ul>
            </div>
            <p className="text-graphite-40 xl:text-base text-sm">&copy; Nevo {year}. All rights reserved.</p>
        </div>
    )
}