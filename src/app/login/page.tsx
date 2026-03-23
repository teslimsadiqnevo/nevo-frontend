import { loginRoles } from "@/shared/lib/lib";
import { ActionButton, Icon } from "@/shared/ui";
import { MiniFooter } from "@/widgets";

export default function LoginPage() {
    return (
        <div className="">
            <MiniFooter speaker />
            <div className="px-6 flex gap-10 mt-13.5 flex-col items-center justify-center">
                <header className="flex flex-col gap-4 items-center justify-center">
                    <h1 className="font-extrabold text-40px">Sign in to Nevo</h1>
                    <p className="font-medium text-xl text-graphite-70">Choose how you access your space.</p>
                </header>

                <main className="flex gap-6">
                    {
                        loginRoles.map((role, index) => (
                            <div className="flex flex-col border border-indigo-10 rounded-3xl xl:w-67 p-6.25 items-center bg-white justify-center" key={index}>
                                <div className="bg-lavender-20 mb-6 rounded-full p-5">
                                    <Icon type={role.icon} width={40} height={40} />
                                </div>
                                <p className="font-bold text-2xl mb-2"> {role.role} </p>
                                <p className="font-medium text-graphite-60 mb-8"> {role.loginType} </p>
                                <ActionButton link={`/login/${role.role.toLowerCase()}`} type="submit" name="Continue" className="cursor-pointer w-full rounded-2xl mt-2.5" />
                            </div>
                        ))
                    }
                </main>
            </div>
        </div>
    )
}