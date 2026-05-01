import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LearningMode = 'visual' | 'audio' | 'action' | 'reading';

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
    learningMode: LearningMode;
    setFirstName: (name: string) => void;
    setAge: (age: string) => void;
    setSchoolId: (id: string | null) => void;
    setClassId: (id: string | null) => void;
    setPin: (pin: string) => void;
    setAssessmentAnswer: (questionId: string, answer: any) => void;
    setToken: (token: string | null) => void;
    setNevoId: (nevoId: string | null) => void;
    setIsAutoAdapt: (val: boolean) => void;
    setLearningMode: (mode: LearningMode) => void;
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
            learningMode: 'visual',
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
            setLearningMode: (learningMode) => set({ learningMode }),
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
                learningMode: 'visual',
            }),
        }),
        {
            name: 'nevo_registration_data',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
