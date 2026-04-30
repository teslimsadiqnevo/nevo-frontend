import Image from "next/image";
import authImg from "@/shared/assets/auth-ill.png"
import { ActionButton } from "@/shared/ui";

export default function GetStarted(){
    return(
        <div className="flex flex-col h-screen w-screen items-center justify-center gap-8">
            <div className="image-container">
                <Image src={authImg} alt="auth-img" width={320} height={240} className="rounded-4xl" />
            </div>

            <div className="flex flex-col gap-2 items-center justify-center">
                <h1 className="font-bold text-[26px] text-indigo">Learning, your way.</h1>
                <p className="text-[15px] text-center text-[#000000A6]">A learning experience built around how you think.</p>
            </div>

            <div className="flex flex-col gap-3 w-full items-center justify-center">
                <ActionButton link="/register" name="Create an account" className="rounded-xl cursor-pointer w-9/10" />
                <ActionButton link="/login" name="Sign in" className="rounded-xl cursor-pointer w-9/10" type="transparent" />
            </div>

            <footer className="absolute bottom-6 w-full text-center">
                <p className="text-[#00000066] text-xs">By continuing, you agree to Nevo's Terms and Privacy Policy.</p>
            </footer>
        </div>
    )
}