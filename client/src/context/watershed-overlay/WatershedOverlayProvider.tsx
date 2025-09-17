import { useContext, useState } from "react";
import { WatershedOverlayContext } from "./WatershedOverlayContext";

export function useWatershedOverlayContext() {
  const ctx = useContext(WatershedOverlayContext);
  if (!ctx) throw new Error('useWatershedOverlay must be used within WatershedOverlayProvider');
  return ctx;
}

export function WatershedOverlayProvider({ children }: { children: React.ReactNode }) {
  const [subcatchment, setSubcatchment] = useState(false);
  const [channels, setChannels] = useState(false);
  const [patches, setPatches] = useState(false);
  const [useSubcatchmentFeatureColor, setUseSubcatchmentFeatureColor] = useState(false);

  return (
    <WatershedOverlayContext.Provider value={{
      subcatchment,
      setSubcatchment,
      channels,
      setChannels,
      patches,
      setPatches,
      useSubcatchmentFeatureColor,
      setUseSubcatchmentFeatureColor
    }}>
      {children}
    </WatershedOverlayContext.Provider>
  );
}
