import Image from "next/image";
import logo from "@/shared/ui/icon/assets/default-logo.svg";

export function SplashScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-parchment">
            <div className="relative flex flex-col items-center justify-center">
                {/* Pulsating Lavender Circle Background */}
                <div className="absolute w-[200px] h-[200px] bg-lavender-15 rounded-full animate-ping" />
                
                {/* Foreground Logo and Text */}
                <div className="relative z-10 flex flex-col items-center mt-2">
                    <Image src={logo} alt="Nevo Logo" width={120} height={40} className="w-28 h-auto" />
                    <span className="mt-2 text-sm italic text-graphite-60">learning, your way</span>
                </div>
            </div>
        </div>
    );
}
