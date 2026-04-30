import { Icon, IconType } from "@/shared/ui";

export function HorizontalCard({ content, icon, width, iconWidth, iconHeight, className, hasPadding, isSelected, onClick, centerText }: { content: string, icon?: IconType, width?: number, iconWidth?: number, iconHeight?: number, className?: string, hasPadding?: boolean, isSelected?: boolean, onClick?: () => void, centerText?: boolean }) {
    return (
        <div
            onClick={onClick}
            className={`p-6.25 relative flex rounded-xl items-center gap-6 transition-all duration-200 ${isSelected ? 'bg-black/5 border-indigo border-2' : 'bg-transparent border-[#E0D9CE] border'} ${onClick ? 'cursor-pointer' : ''} ${width ? `w-[${width}px]` : "w-full"} ${centerText ? 'justify-center' : 'justify-start'} ${className || ""}`}
        >
            {icon && <div className={`${hasPadding ? 'bg-parchment-50 p-2.5 rounded-full' : ''} ${centerText ? 'absolute left-6' : ''}`}> <Icon type={icon} width={iconWidth || 32} height={iconHeight || 32} /> </div>}
            <p className={`text-[15px] ${centerText ? 'text-center w-full' : ''}`}>{content}</p>
            {isSelected && centerText && <Icon type="tick-II" width={24} height={24} className="absolute right-6" />}
        </div>
    )
}