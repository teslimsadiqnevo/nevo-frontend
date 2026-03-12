export function Input({ label, placeholder, name, value, width, type, onChange }: { label: string, placeholder: string, name: string, value: string, width?: number | string, type: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={name} className="font-semibold">{label}</label>
            <input type={type} id={name} placeholder={placeholder} value={value} className={`bg-white rounded-2xl text-lg border border-indigo-20 px-6 py-4 outline-none ${width === 'full' ? 'w-full' : `w-[${width}px]`}`} onChange={onChange} />
        </div>
    )
}