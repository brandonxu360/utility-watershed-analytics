import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createOverlaySlice, type OverlaySlice } from './slices/overlaySlice';
import { createLanduseSlice, type LanduseSlice } from './slices/landuseSlice';
import { createPanelSlice, type PanelSlice } from './slices/panelSlice';
import { createHillslopeSlice, type HillslopeSlice } from './slices/hillslopeSlice';
import { createSharedActionsSlice, type SharedActionsSlice } from './slices/sharedActionsSlice';

export type AppState = OverlaySlice & LanduseSlice & PanelSlice & HillslopeSlice & SharedActionsSlice;

export const useAppStore = create<AppState>()(
    devtools(
        (...a) => ({
            ...createOverlaySlice(...a),
            ...createLanduseSlice(...a),
            ...createPanelSlice(...a),
            ...createHillslopeSlice(...a),
            ...createSharedActionsSlice(...a),
        }),
        { name: 'app-store' }
    )
);

