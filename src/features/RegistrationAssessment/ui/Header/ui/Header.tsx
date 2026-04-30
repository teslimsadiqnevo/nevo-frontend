export function Header({number, title, className}: {number?: number, title: string, className?: string}) {
    return (
        <header className={`flex flex-col text-center gap-6 items-center justify-center ${className}`}>
            <h1 className="font-semibold text-lg text-graphite">{title}</h1>
        </header>
    )
}