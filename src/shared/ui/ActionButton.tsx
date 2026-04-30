export type ButtonTypes = {
    link?: string,
    name: string,
    className?: string,
    type?: "button" | "submit" | "reset" | "transparent",
    width?: number,
    rounded?: boolean,
    onClick?: () => void
}

export function ActionButton({ link, name, className = "", type, width, rounded, onClick }: ButtonTypes) {
    const defaultWidth = !width && !className.includes("w-") ? "w-fit" : "";
    const baseClasses = ` ${rounded ? 'rounded-full' : ''} px-8 font-semibold text-center inline-block ${type === "transparent" ? "text-indigo bg-transparent border border-indigo" : "text-white bg-indigo"} ${defaultWidth} py-3 ${className}`;
    
    // Tailwind's JIT compiler doesn't support dynamically constructed class names like \`w-[\${width}px]\`.
    // Apply dynamic numerical widths via the inline style prop instead.
    const customStyle = width ? { width: `${width}px` } : undefined;

    if (onClick && !link) {
        return (
            <button className={baseClasses} onClick={onClick} type={type === "transparent" ? "button" : type} style={customStyle}>
                {name}
            </button>
        )
    }

    return (
        <a className={baseClasses} href={link} type={type} style={customStyle}> {name} </a>
    )
}