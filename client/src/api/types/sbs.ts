/**
 * Color modes for SBS (Soil Burn Severity) raster tiles and legend.
 * The backend is the source of truth; the frontend passes this value as
 * a query param to both the tile endpoint and GET /api/watershed/sbs/colormap.
 */
export type SbsColorMode = "legacy" | "shift";

export type SbsColormapEntry = {
  /** SBS canonical class value (130 = Unburned … 133 = High) */
  class_value: number;
  /** Human-readable severity label */
  label: string;
  rgba: [number, number, number, number];
  hex: string;
};

export type SbsColormapResponse = {
  mode: SbsColorMode;
  entries: SbsColormapEntry[];
};
