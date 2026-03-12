import { Icon } from "@/shared/ui";

export function MiniFooter({ speaker }: { speaker?: boolean }) {
    return (
        <nav className={`px-12 bg-parchment py-4 flex ${speaker ? 'justify-between' : 'justify-center'} items-center`}>
            <a href="/">
                <Icon type={'default'} width={73} height={22} />
            </a>
            {speaker && <Icon type={'speaker-two'} width={32} height={32} />}
        </nav>
    )
}