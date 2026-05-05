import Link from "next/link";
import { Icon } from "@/shared/ui";

export function MiniFooter({
    speaker,
    logIn,
    onSpeakerClick,
    speakerActive,
    speakerLoading,
}: {
    speaker?: boolean;
    logIn?: boolean;
    onSpeakerClick?: () => void;
    speakerActive?: boolean;
    speakerLoading?: boolean;
}) {
    return (
        <nav className={`px-6 sm:px-12 bg-parchment py-4 flex ${(speaker || logIn) ? 'justify-between' : 'justify-center'} items-center`}>
            <Link href="/">
                <Icon type={'default'} width={73} height={22} className="w-[60px] sm:w-[73px] h-auto" />
            </Link>
            {speaker ? (
                <button
                    type="button"
                    onClick={onSpeakerClick}
                    aria-label={speakerActive ? 'Pause question audio' : 'Play question audio'}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-opacity ${
                        speakerLoading ? 'opacity-60' : speakerActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                    }`}
                >
                    <Icon type={'speaker-two'} width={32} height={32} className="w-7 h-7 sm:w-8 sm:h-8" />
                </button>
            ) : null}
            {logIn && <Link href="/login" className="font-medium text-indigo">Already have an account? Log in</Link>}
        </nav>
    )
}
