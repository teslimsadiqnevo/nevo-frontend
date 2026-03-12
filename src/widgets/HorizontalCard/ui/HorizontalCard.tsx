import { Icon, IconType } from "@/shared/ui";

export function HorizontalCard({ content, icon, width, iconWidth, iconHeight, className, hasPadding, isSelected, onClick }: { content: string, icon?: IconType, width?: number, iconWidth?: number, iconHeight?: number, className?: string, hasPadding?: boolean, isSelected?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={`p-6.25 flex rounded-20px border items-center justify-start gap-6 transition-colors duration-200 ${isSelected ? 'bg-indigo-10 border-indigo' : 'bg-white border-indigo-10'} ${onClick ? 'cursor-pointer' : ''} ${width ? `w-[${width}px]` : ""} ${className || ""}`}
        >
            {icon && <div className={`${hasPadding ? 'bg-parchment-50 p-2.5 rounded-full' : ''}`}> <Icon type={icon} width={iconWidth || 32} height={iconHeight || 32} /> </div>}
            <p className="font-semibold text-lg">{content}</p>
        </div>
    )
}