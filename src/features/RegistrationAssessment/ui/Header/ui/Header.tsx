export function Header({number, title, className}: {number: number, title: string, className?: string}) {
    return (
        <header className={`flex flex-col text-center gap-6 items-center justify-center ${className}`}>
            <p className="font-semibold text-sm text-indigo">Question {number} of 7</p>
            <h1 className="font-extrabold text-3-4xl">{title}</h1>
        </header>
    )
}