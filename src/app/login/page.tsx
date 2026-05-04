import { roles } from "@/shared/lib/lib";
import { Icon } from "@/shared/ui";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex flex-col justify-center items-center ">
            <Link href="/auth" className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start">
                <Icon type="back" width={24} height={24} />
            </Link>

            <header className="flex mt-10 flex-col gap-3 justify-center items-center">
                <h1 className="font-bold text-[22px] text-indigo">Welcome back</h1>
                <p className="text-sm ">Select your role to sign in.</p>
            </header>

            <main className="flex w-full flex-col gap-3 px-6 mt-20">
                {roles.map((role, index) => (
                    <Link href={`/login/${role.name.toLowerCase()}`} key={index} className="flex items-center justify-between py-6.5 px-5.25 border border-[#E0D9CE] cursor-pointer hover:bg-indigo-5 hover:border-2 hover:border-indigo transition-colors rounded-xl">
                        <div className="flex items-center gap-4">
                            <Icon type={role.icon} width={28} height={28} />
                            <p className="font-semibold text-indigo">{`${role.name === "School" ? "My " : "I'm a "} ${role.name}`}</p>           
                        </div>
                        <Icon type="forward" width={16} height={16} />
                    </Link>
                ))}
            </main>
        </div>
    )
}
