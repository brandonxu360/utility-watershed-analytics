import { createContext } from "react";

type WatershedOverlayContextType = {
    subcatchment: boolean;
    setSubcatchment: (value: boolean) => void;
    channels: boolean;
    setChannels: (value: boolean) => void;
    patches: boolean;
    setPatches: (value: boolean) => void;
    useSubcatchmentFeatureColor: boolean;
    setUseSubcatchmentFeatureColor: (value: boolean) => void;
}

export const WatershedOverlayContext = createContext<WatershedOverlayContextType | null>(null);
