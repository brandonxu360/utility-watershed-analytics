import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface PanelSlice {
    isPanelOpen: boolean;
    panelContent: React.ReactNode | null;
    openPanel: (content?: React.ReactNode | null) => void;
    closePanel: () => void;
    setPanelContent: (content: React.ReactNode | null) => void;
}

export const createPanelSlice: StateCreator<
    AppState,
    [["zustand/devtools", never]],
    [],
    PanelSlice
> = (set) => ({
    isPanelOpen: false,
    panelContent: null,
    openPanel: (content) => set({ isPanelOpen: true, panelContent: content ?? null }),
    closePanel: () => set({ isPanelOpen: false, panelContent: null }),
    setPanelContent: (content) => set({ panelContent: content }),
});
