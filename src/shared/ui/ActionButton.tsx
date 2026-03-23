export type ButtonTypes = {
    link?: string,
    name: string,
    className?: string,
    type?: "button" | "submit" | "reset" | "transparent",
    width?: number,
    rounded?: string,
    onClick?: () => void
}

export function ActionButton({ link, name, className, type, width, rounded, onClick }: ButtonTypes) {
    const baseClasses = ` ${rounded ? 'rounded-full' : ''} px-8 font-semibold text-center inline-block ${type === "transparent" ? "text-indigo bg-transparent border border-indigo" : "text-white bg-indigo"} ${width ? `w-${width}` : "w-fit"} py-3 ${className}`;

    if (onClick && !link) {
        return (
            <button className={baseClasses} onClick={onClick} type={type === "transparent" ? "button" : type}>
                {name}
            </button>
        )
    }

    return (
        <a className={baseClasses} href={link} type={type}> {name} </a>
    )
}