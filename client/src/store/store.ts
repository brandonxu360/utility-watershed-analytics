import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createOverlaySlice, type OverlaySlice } from './slices/overlaySlice';
import { createLanduseSlice, type LanduseSlice } from './slices/landuseSlice';
import { createPanelSlice, type PanelSlice } from './slices/panelSlice';
import { createHillslopeSlice, type HillslopeSlice } from './slices/hillslopeSlice';

export type AppState = OverlaySlice & LanduseSlice & PanelSlice & HillslopeSlice;

export const useAppStore = create<AppState>()(
    devtools(
        (...a) => ({
            ...createOverlaySlice(...a),
            ...createLanduseSlice(...a),
            ...createPanelSlice(...a),
            ...createHillslopeSlice(...a),
        }),
        { name: 'app-store' }
    )
);

