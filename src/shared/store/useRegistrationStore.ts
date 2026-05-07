import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LearningMode = 'visual' | 'audio' | 'action' | 'reading';
type AssessmentAnswerValue = string | number | boolean | string[] | null;

export function normalizeLearningMode(value?: string | null): LearningMode {
    const normalized = String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ');

    if (/(audio|auditory|aural|listen|listening|hear|hearing|spoken|voice)/.test(normalized)) {
        return 'audio';
    }

    if (/(action|kinesthetic|kinaesthetic|hands on|hands-on|doing|movement|practical|tactile)/.test(normalized)) {
        return 'action';
    }

    if (/(read|reading|write|writing|text|notes|verbal|literacy)/.test(normalized)) {
        return 'reading';
    }

    return 'visual';
}

interface RegistrationState {
    firstName: string;
    surname: string;
    age: string;
    schoolId: string | null;
    classId: string | null;
    pin: string;
    assessmentAnswers: Record<string, AssessmentAnswerValue>;
    token: string | null;
    nevoId: string | null;
    isAutoAdapt: boolean;
    learningMode: LearningMode;
    setFirstName: (name: string) => void;
    setSurname: (surname: string) => void;
    setAge: (age: string) => void;
    setSchoolId: (id: string | null) => void;
    setClassId: (id: string | null) => void;
    setPin: (pin: string) => void;
    setAssessmentAnswer: (questionId: string, answer: AssessmentAnswerValue) => void;
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
            surname: '',
            age: '',
            schoolId: null,
            classId: null,
            pin: '',
            assessmentAnswers: {},
            token: null,
            nevoId: null,
            isAutoAdapt: true,
            learningMode: 'visual',
            setFirstName: (firstName) => set({ firstName }),
            setSurname: (surname) => set({ surname }),
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
                surname: '',
                age: '',
                schoolId: null,
                classId: null,
                pin: '',
                assessmentAnswers: {},
                token: null,
                nevoId: null,
                isAutoAdapt: true,
                learningMode: 'visual',
            }),
        }),
        {
            name: 'nevo_registration_data',
            storage: createJSONStorage(() => sessionStorage),
        }
    )
);
