import { create } from "zustand";
import { Properties } from "../types/WatershedFeature";

type BottomPanelState = {
    isOpen: boolean;
    content: React.ReactNode | null;
    selectedHillslopeId: string | null;
    selectedHillslopeProps: Properties | null;
    openPanel: (content?: React.ReactNode | null) => void;
    closePanel: () => void;
    setPanelContent: (content: React.ReactNode | null) => void;
    setSelectedHillslope: (id: string | null, props?: Properties | null) => void;
    clearSelectedHillslope: () => void;
};

export const useBottomPanelStore = create<BottomPanelState>((set) => ({
    isOpen: false,
    content: null,
    selectedHillslopeId: null,
    selectedHillslopeProps: null,
    openPanel: (content) => set({ isOpen: true, content }),
    closePanel: () => set({ isOpen: false, content: null }),
    setPanelContent: (content) => set({ content }),
    setSelectedHillslope: (id, props) => set({ selectedHillslopeId: id, selectedHillslopeProps: props ?? null }),
    clearSelectedHillslope: () => set({ selectedHillslopeId: null, selectedHillslopeProps: null }),
}));