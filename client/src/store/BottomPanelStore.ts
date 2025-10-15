import { create } from "zustand";

type BottomPanelState = {
    shrubCover: boolean;
    treeCover: boolean;
    isOpen: boolean;
    content: React.ReactNode | null;
    setShrubCover: (visible: boolean) => void;
    setTreeCover: (visible: boolean) => void;
    openPanel: (content?: React.ReactNode | null) => void;
    closePanel: () => void;
    setPanelContent: (content: React.ReactNode | null) => void;
};

export const useBottomPanelStore = create<BottomPanelState>((set) => ({
    shrubCover: false,
    treeCover: false,
    isOpen: false,
    content: null,
    setShrubCover: (visible) => set({ shrubCover: visible }),
    setTreeCover: (visible) => set({ treeCover: visible }),
    openPanel: (content) => set({ isOpen: true, content }),
    closePanel: () => set({ isOpen: false, content: null }),
    setPanelContent: (content) => set({ content }),
}));