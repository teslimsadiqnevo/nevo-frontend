import { create } from 'zustand';

export type ToastVariant = 'info' | 'success' | 'error' | 'warning';

export type Toast = {
    id: string;
    title?: string;
    message: string;
    variant: ToastVariant;
    durationMs: number;
};

type ToastState = {
    toasts: Toast[];
    show: (input: { title?: string; message: string; variant?: ToastVariant; durationMs?: number }) => string;
    dismiss: (id: string) => void;
    clear: () => void;
};

let counter = 0;
const nextId = () => `${Date.now()}-${++counter}`;

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    show: ({ title, message, variant = 'info', durationMs = 4000 }) => {
        const id = nextId();
        set((state) => ({
            toasts: [...state.toasts, { id, title, message, variant, durationMs }],
        }));
        return id;
    },
    dismiss: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
    clear: () => set({ toasts: [] }),
}));

export function toast(input: { title?: string; message: string; variant?: ToastVariant; durationMs?: number }) {
    return useToastStore.getState().show(input);
}
