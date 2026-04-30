import Image from "next/image";

export function DashboardCard({ 
    title, 
    subtitle, 
    actionText, 
    actionLink, 
    imageSrc 
}: { 
    title: string, 
    subtitle: string, 
    actionText: string, 
    actionLink: string, 
    imageSrc: string 
}) {
    return (
        <div className="bg-white rounded-[24px] p-8 flex justify-between items-center w-full max-w-[800px]">
            <div className="flex flex-col">
                <h3 className="text-[20px] font-extrabold text-[#111111] leading-tight">{title}</h3>
                <p className="text-graphite-60 text-[14px] mt-1 mb-8">{subtitle}</p>
                <a href={actionLink} className="text-[#3B3F6E] px-4 font-bold text-[14px] hover:underline inline-block">
                    {actionText}
                </a>
            </div>
            <div className="w-[124px] h-[82px] rounded-2xl overflow-hidden relative border border-[#E9E9EB]">
                <Image src={imageSrc} alt={title} fill className="object-cover" />
            </div>
        </div>
    );
}
