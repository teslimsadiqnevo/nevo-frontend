import { Icon } from "@/shared/ui";
import { roles } from "@/shared/lib";
import Link from "next/link";

export default function Register() {
    return (
        // <div className="flex flex-col justify-center xl:px-20 pb-9 gap-23">
        //     <MiniFooter logIn />
        //     <main className="flex flex-col items-center">
        //         <h1 className="font-bold text-5xl mb-4">How are you using Nevo today?</h1>
        //         <p className="font-medium mb-14 text-xl text-graphite-70">Choose your role to get the right experience.</p>
        //         <div className="flex mb-12 items-center justify-between gap-5 xl:gap-8">
        //             {
        //                 roles.map((role, index) => (
        //                     <div key={index} className="bg-white xl:w-[378px] w-[300px] flex flex-col items-center justify-between xl:h-102.25 h-[350px] px-10 py-12 rounded-20px xl:rounded-3xl">
        //                         <Icon type={role.icon} width={80} height={80} />
        //                         <h2 className="font-bold text-2xl">{role.path}</h2>
        //                         <p className="text-graphite-80">{role.desc}</p>
        //                         <ActionButton link={`/register/${role.name.toLowerCase()}`} name={`Continue as ${role.name}`} type="transparent" className="rounded-xl cursor-pointer py-3 xl:text-base text-sm w-full" />
        //                     </div>
        //                 ))
        //             }
        //         </div>
        //         <p className="font-medium text-[15px] text-graphite-60">Not sure yet? You can switch roles later.</p>
        //     </main>
        // </div>
        <div className="flex flex-col justify-center items-center ">
            <Link href="/auth" className="icon p-2.5 pl-6 cursor-pointer mt-10 flex w-full justify-start">
                <Icon type="back" width={24} height={24} />
            </Link>

            <header className="flex mt-10 flex-col gap-3 justify-center items-center">
                <h1 className="font-bold text-[22px] text-indigo">Who are you?</h1>
                <p className="text-sm ">Choose your role to get started.</p>
            </header>

            <main className="flex w-full flex-col gap-3 px-6 mt-20">
                {roles.map((role, index) => (
                    <Link href={`/register/${role.name.toLowerCase()}`} key={index} className="flex items-center justify-between py-6.5 px-5.25 border border-[#E0D9CE] cursor-pointer hover:bg-indigo-5 hover:border-2 hover:border-indigo transition-colors rounded-xl">
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
