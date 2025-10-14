export interface Geometry {
  type: "MultiPolygon" | "Polygon" | string;
  coordinates: number[][][][];
}

export interface Properties {
  area_m2: number;
  aspect: number;
  baseflow_mm: number;
  baseflow_volume_m3: number;
  cancov: number;
  centroid_lat: number;
  centroid_lon: number;
  centroid_px: number;
  centroid_py: number;
  clay: number;
  color: string;
  deploss_kg: number;
  desc: string;
  direction: number;
  disturbed_class: string;
  dom: number;
  elevation_m: number;
  inrcov: number;
  length_m: number;
  ll: [number, number] | null;
  mukey: string;
  particulate_phosphorus_kg: number;
  rilcov: number;
  runoff_mm: number;
  runoff_volume_m3: number;
  sand: number;
  sediment_deposition_kg: number;
  sediment_yield_kg: number;
  simple_texture: string;
  slope_scalar: number;
  soil: string;
  soil_loss_kg: number;
  solub_react_phosphorus_kg: number;
  subrunoff_mm: number;
  subrunoff_volume_m3: number;
  topazid: number;
  total_phosphorus_kg: number;
  watershed: string;
  weppid: number;
  width_m: number;
}

export type WatershedFeature = {
  type: "Feature";
  id: number | string;
  geometry: Geometry;
  properties: Properties;
};
