import { Icon, type IconType } from "@/shared/ui/icon/Icon";

export interface LessonCardProps {
    title: string;
    subject: string;
    grade: string;
    status: 'Ready' | 'Assigned' | 'Draft';
    lastEdited: string;
    iconType: IconType;
}

export function LessonCard({ title, subject, grade, status, lastEdited, iconType }: LessonCardProps) {
    return (
        <div className="bg-white rounded-2xl border border-[#EAEAEA] p-6 flex flex-col justify-between h-[160px] shadow-[0px_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md cursor-pointer">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-graphite-5 flex items-center justify-center shrink-0 overflow-hidden">
                        {status === 'Ready' && <Icon type="open-book" width={24} height={24} />}
                        {status === 'Assigned' && <Icon type="default" width={24} height={24} />}
                        {status === 'Draft' && <Icon type="leaf-drop" width={24} height={24} />}
                    </div>
                    <div>
                        <h3 className="text-[16px] font-extrabold text-[#3B3F6E] leading-tight mb-1">{title}</h3>
                        <p className="text-graphite-60 text-[13px]">{subject} • {grade}</p>
                    </div>
                </div>
                <button className="text-graphite-40 hover:text-black mt-1 p-1 rounded-full hover:bg-gray-100 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1.5"></circle>
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="12" cy="19" r="1.5"></circle>
                    </svg>
                </button>
            </div>
            <div className="flex justify-between items-center mt-auto">
                <span className="px-3 py-1 bg-[#F2F2F2] text-[#4A4A4A] text-[12px] font-bold rounded-md leading-tight">
                    {status}
                </span>
                <span className="text-graphite-40 text-[12px] font-medium">
                    {lastEdited}
                </span>
            </div>
        </div>
    );
}
