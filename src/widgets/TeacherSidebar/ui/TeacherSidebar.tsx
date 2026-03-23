import { Icon } from "@/shared/ui";

export function TeacherSidebar() {
    return (
        <aside className="w-64 bg-white flex flex-col pt-8 pb-8 px-4 h-full">
            <h1 className="text-[22px] font-extrabold text-[#111111] px-4 mb-10">Nevo</h1>
            <nav className="flex flex-col gap-2 flex-1">
                <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[#EEF0F8] rounded-2xl text-[#3B3F6E] font-bold text-sm transition-colors">
                    <Icon type="home-active" width={18} height={18} />
                    <span>Home</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-graphite-60 font-medium hover:bg-graphite-5 rounded-2xl transition-colors text-sm">
                    <Icon type="lessons-inactive" width={18} height={18} />
                    <span>Lessons</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-graphite-60 font-medium hover:bg-graphite-5 rounded-2xl transition-colors text-sm">
                    <Icon type="connect-inactive" width={18} height={18} />
                    <span>Connect</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-3 text-graphite-60 font-medium hover:bg-graphite-5 rounded-2xl transition-colors text-sm">
                    <Icon type="profile-inactive" width={18} height={18} />
                    <span>Profile</span>
                </a>
            </nav>
            <button className="flex justify-center items-center gap-2 mt-auto bg-[#3B3F6E] text-white py-[14px] rounded-[24px] font-semibold text-sm hover:bg-opacity-90 transition-colors cursor-pointer">
                <Icon type="stars" width={16} height={16} className="text-white invert" />
                <span>Ask Nevo</span>
            </button>
        </aside>
    );
}
