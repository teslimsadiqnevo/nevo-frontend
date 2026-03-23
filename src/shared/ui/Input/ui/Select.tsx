'use client'

export function Select({ label, name, width, value, options, onChange }: { label: string, name: string, width: number, value: string, options: { label: string, value: string }[], onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={name} className="font-semibold">{label}</label>
            <div className="relative">
                <select
                    id={name}
                    className={`appearance-none bg-white rounded-2xl text-lg border border-indigo-20 px-6 py-4 outline-none w-[${width}px]`}
                    value={value}
                    onChange={onChange}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-6 text-indigo">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                </div>
            </div>
        </div>
    )
}
