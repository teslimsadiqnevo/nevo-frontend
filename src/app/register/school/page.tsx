"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/shared/ui";

export default function SchoolRegistrationPage() {
    const router = useRouter();
    const [schoolName, setSchoolName] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedState, setSelectedState] = useState("");
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const states = [
        "Abia State", "Adamawa State", "Akwa Ibom State", "Anambra State", 
        "Bauchi State", "Bayelsa State", "Benue State", "Borno State", 
        "Cross River State", "Delta State", "Ebonyi State", "Edo State", 
        "Ekiti State", "Enugu State", "FCT", "Gombe State", "Imo State", 
        "Jigawa State", "Kaduna State", "Kano State", "Katsina State", 
        "Kebbi State", "Kogi State", "Kwara State", "Lagos State", 
        "Nasarawa State", "Niger State", "Ogun State", "Ondo State", 
        "Osun State", "Oyo State", "Plateau State", "Rivers State", 
        "Sokoto State", "Taraba State", "Yobe State", "Zamfara State"
    ];

    const isComplete = 
        schoolName.trim() !== "" && 
        fullName.trim() !== "" && 
        email.trim() !== "" && 
        password.length >= 8 && 
        selectedState !== "";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            if (email.toLowerCase().trim() === "chidinma.adeyemi@fgclagos.edu.ng") {
                setError("An account with this email already exists.");
            } else {
                router.push('/register/school/data-agreement');
            }
        }, 1000);
    };

    return (
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-[#F6F5F2] min-h-screen">
            <div className="flex items-center justify-center gap-[6px] mb-8 mt-4">
                <Icon type="default" width={113} height={34} />
            </div>

            <div className="flex flex-col items-center w-full max-w-[420px] pb-10">
                <h1 className="font-extrabold text-[#3B3F6E] text-[22px] mb-[6px] text-center tracking-tight">Register your school</h1>
                <p className="text-[13px] text-graphite opacity-60 font-medium mb-10 text-center">Set up your school's Nevo workspace.</p>
                
                <form className="flex flex-col w-full gap-[14px]" onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        placeholder="Your school's full name" 
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full bg-transparent border border-[#3B3F6E]/20 rounded-[10px] px-5 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] focus:border-[#3B3F6E]/50"
                    />

                    <input 
                        type="text" 
                        placeholder="Your full name" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-transparent border border-[#3B3F6E]/20 rounded-[10px] px-5 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] focus:border-[#3B3F6E]/50"
                    />

                    <div className="w-full flex flex-col gap-[6px]">
                        <input 
                            type="email" 
                            placeholder="Your work email address" 
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            className={`w-full bg-transparent border rounded-[10px] px-5 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] ${
                                error ? "border-[#E57661]" : "border-[#3B3F6E]/20 focus:border-[#3B3F6E]/50"
                            }`}
                        />
                        {error && (
                            <span className="text-[10px] font-bold text-[#E57661] ml-2 tracking-wide">{error}</span>
                        )}
                    </div>

                    <div className="relative w-full flex flex-col gap-[6px] mt-1">
                        <div className="relative w-full">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Create a password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent border border-[#3B3F6E]/20 rounded-[10px] pl-5 pr-12 py-[14px] outline-none transition-colors text-[13px] font-medium placeholder:text-[#3B3F6E]/40 text-[#3B3F6E] focus:border-[#3B3F6E]/50"
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#3B3F6E]/50 hover:text-[#3B3F6E] transition-colors p-[2px] cursor-pointer"
                            >
                                <Icon type="eye" width={18} height={18} />
                            </button>
                        </div>
                        <span className="text-[10px] font-medium text-graphite opacity-50 ml-2 tracking-wide">At least 8 characters</span>
                    </div>

                    <div className="relative w-full mt-2">
                        <select 
                            value={selectedState} 
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full bg-transparent border border-[#3B3F6E]/20 rounded-[10px] pl-5 pr-12 py-[14px] outline-none transition-colors text-[13px] font-medium text-[#3B3F6E] focus:border-[#3B3F6E]/50 appearance-none cursor-pointer"
                            style={{ 
                                color: selectedState === "" ? "rgba(59, 63, 110, 0.4)" : "#3B3F6E"
                            }}
                        >
                            <option value="" disabled className="text-[#3B3F6E]/40">Select your state</option>
                            {states.map(state => (
                                <option key={state} value={state} className="text-[#3B3F6E]">{state}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                            <Icon type="chevron-down" width={14} height={14} />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!isComplete || isLoading}
                        className={`w-full font-bold rounded-[10px] py-[14px] text-[14px] outline-none transition-all mt-[18px] shadow-sm ${
                            !isComplete || isLoading
                                ? 'bg-[#9A9BB5] text-white cursor-not-allowed opacity-90'
                                : 'bg-[#3B3F6E] text-white hover:opacity-90 active:scale-[0.98] cursor-pointer'
                        }`}
                    >
                        {isLoading ? 'Creating account...' : 'Create school account'}
                    </button>

                    <div className="flex justify-center mt-2">
                        <a href="/login/school" className="text-[11px] text-graphite opacity-60 font-bold transition-colors hover:opacity-100 cursor-pointer">
                            Already registered? <span className="text-[#A29ECA] group-hover:text-[#3B3F6E] transition-colors">Sign in</span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}