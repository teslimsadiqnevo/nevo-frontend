import { roles } from "@/shared/lib";
import { ActionButton, Icon } from "@/shared/ui";
import { MiniFooter } from "@/widgets";

export default function Register() {
    return (
        <div className="flex flex-col justify-center xl:px-20 pb-9 gap-23">
            <MiniFooter logIn />
            <main className="flex flex-col items-center">
                <h1 className="font-bold text-5xl mb-4">How are you using Nevo today?</h1>
                <p className="font-medium mb-14 text-xl text-graphite-70">Choose your role to get the right experience.</p>
                <div className="flex mb-12 items-center justify-between gap-5 xl:gap-8">
                    {
                        roles.map((role, index) => (
                            <div key={index} className="bg-white xl:w-[378px] w-[300px] flex flex-col items-center justify-between xl:h-102.25 h-[350px] px-10 py-12 rounded-20px xl:rounded-3xl">
                                <Icon type={role.icon} width={80} height={80} />
                                <h2 className="font-bold text-2xl">{role.path}</h2>
                                <p className="text-graphite-80">{role.desc}</p>
                                <ActionButton link={`/register/${role.name.toLowerCase()}`} name={`Continue as ${role.name}`} type="transparent" className="rounded-xl cursor-pointer py-3 xl:text-base text-sm w-full" />
                            </div>
                        ))
                    }
                </div>
                <p className="font-medium text-[15px] text-graphite-60">Not sure yet? You can switch roles later.</p>
            </main>
        </div>
    )
}