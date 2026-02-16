/**
 * Properties specific to subcatchment/hillslope features.
 * These features represent individual hillslopes within a watershed.
 * Based on the backend API schema for /api/watershed/{id}/subcatchments endpoint.
 */
export interface SubcatchmentProperties {
  // Core identifiers
  topazid: number;
  weppid: number;
  watershed: string;

  // Hillslope geometry and characteristics
  slope_scalar: number | null;
  length: number | null;
  width: number | null;
  direction: number | null;
  aspect: number | null;
  hillslope_area: number | null;
  elevation: number | null;
  centroid_px: number | null;
  centroid_py: number | null;
  centroid_lon: number | null;
  centroid_lat: number | null;

  // Soil data fields
  mukey: string | null;
  soil_fname: string | null;
  soils_dir: string | null;
  soil_build_date: string | null;
  soil_desc: string | null;
  soil_color: string | null;
  soil_area: number | null;
  soil_pct_coverage: number | null;
  clay: number | null;
  sand: number | null;
  avke: number | null;
  ll: number | null;
  bd: number | null;
  simple_texture: string | null;

  // Land use data fields
  landuse_key: number | null;
  landuse_map: string | null;
  man_fn: string | null;
  man_dir: string | null;
  landuse_desc: string | null;
  landuse_color: string | null;
  landuse_area: number | null;
  landuse_pct_coverage: number | null;
  cancov: number | null;
  inrcov: number | null;
  rilcov: number | null;
  cancov_override: number | null;
  inrcov_override: number | null;
  rilcov_override: number | null;
  disturbed_class: string | null;
}
