import { Icon } from "@/shared/ui";

export function MiniFooter({ speaker }: { speaker?: boolean }) {
    return (
        <nav className={`px-6 sm:px-12 bg-parchment py-4 flex ${speaker ? 'justify-between' : 'justify-center'} items-center`}>
            <a href="/">
                <Icon type={'default'} width={73} height={22} className="w-[60px] sm:w-[73px] h-auto" />
            </a>
            {speaker && <Icon type={'speaker-two'} width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8" />}
        </nav>
    )
}