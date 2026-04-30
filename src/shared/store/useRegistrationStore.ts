import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface RegistrationState {
    firstName: string;
    age: string;
    schoolId: string | null;
    classId: string | null;
    pin: string;
    assessmentAnswers: Record<string, any>;
    token: string | null;
    nevoId: string | null;
    isAutoAdapt: boolean;
    setFirstName: (name: string) => void;
    setAge: (age: string) => void;
    setSchoolId: (id: string | null) => void;
    setClassId: (id: string | null) => void;
    setPin: (pin: string) => void;
    setAssessmentAnswer: (questionId: string, answer: any) => void;
    setToken: (token: string | null) => void;
    setNevoId: (nevoId: string | null) => void;
    setIsAutoAdapt: (val: boolean) => void;
    clearRegistration: () => void;
}

export const useRegistrationStore = create<RegistrationState>()(
    persist(
        (set) => ({
            firstName: '',
            age: '',
            schoolId: null,
            classId: null,
            pin: '',
            assessmentAnswers: {},
            token: null,
            nevoId: null,
            isAutoAdapt: false,
            setFirstName: (firstName) => set({ firstName }),
            setAge: (age) => set({ age }),
            setSchoolId: (schoolId) => set({ schoolId }),
            setClassId: (classId) => set({ classId }),
            setPin: (pin) => set({ pin }),
            setAssessmentAnswer: (questionId, answer) =>  
                set((state) => ({
                    assessmentAnswers: {
                        ...state.assessmentAnswers,
                        [questionId]: answer
                    }
                })),
            setToken: (token) => set({ token }),
            setNevoId: (nevoId) => set({ nevoId }),
            setIsAutoAdapt: (isAutoAdapt) => set({ isAutoAdapt }),
            clearRegistration: () => set({
                firstName: '',
                age: '',
                schoolId: null,
                classId: null,
                pin: '',
                assessmentAnswers: {},
                token: null,
                nevoId: null,
                isAutoAdapt: false,
            }),
        }),
        {
            name: 'nevo_registration_data',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
