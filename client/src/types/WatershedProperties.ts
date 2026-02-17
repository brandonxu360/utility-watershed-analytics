/**
 * Properties specific to watershed features (top-level watershed boundaries).
 * Based on the backend API schema for /api/watershed/ endpoint.
 */
export interface WatershedProperties {
  // Identifiers
  pws_id: string;
  srcname: string;
  pws_name: string;

  // Location information
  county_nam: string;
  state: string | null;

  // Watershed classification
  huc10_id: string;
  huc10_name: string;
  wws_code: string;

  // Source information
  srctype: string;

  // Area and geometry
  shape_leng: number;
  shape_area: number;
}
