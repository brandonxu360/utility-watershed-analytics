import { create } from "zustand";

type BottomPanelState = {
    isOpen: boolean;
    content: React.ReactNode | null;
    openPanel: (content?: React.ReactNode | null) => void;
    closePanel: () => void;
    setPanelContent: (content: React.ReactNode | null) => void;
};

export const useBottomPanelStore = create<BottomPanelState>((set) => ({
    isOpen: false,
    content: null,
    openPanel: (content) => set({ isOpen: true, content }),
    closePanel: () => set({ isOpen: false, content: null }),
    setPanelContent: (content) => set({ content }),
}));