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

  // Utility metadata (nasa-roses batch, from merged utility data)
  owner_type: string | null;   // Water Utility Type
  pop_group: string | null;    // Customers Served range
  treat_type: string | null;   // Treatment Processes
  conn_group: string | null;   // Connection Group range

  // HUC10-level aggregates (all utilities sharing this watershed boundary)
  huc10_pws_names: string | null;
  huc10_owner_types: string | null;
  huc10_pop_groups: string | null;
  huc10_treat_types: string | null;
  huc10_utility_count: number | null;
}
