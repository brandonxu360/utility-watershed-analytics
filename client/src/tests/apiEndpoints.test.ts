import { describe, it, expect } from "vitest";
import { API_ENDPOINTS } from "../api/apiEndpoints";

describe("API_ENDPOINTS URL encoding", () => {
  it("WATERSHED encodes id with special characters", () => {
    const url = API_ENDPOINTS.WATERSHED("run with spaces");
    expect(url).toContain("run%20with%20spaces");
    expect(url).not.toContain("run with spaces");
  });

  it("SUBCATCHMENTS encodes id", () => {
    const url = API_ENDPOINTS.SUBCATCHMENTS("id#hash");
    expect(url).toContain("id%23hash");
  });

  it("CHANNELS encodes id", () => {
    const url = API_ENDPOINTS.CHANNELS("id&amp");
    expect(url).toContain("id%26amp");
  });

  it("SBS_TILE encodes runId", () => {
    const url = API_ENDPOINTS.SBS_TILE("run?query");
    expect(url).toContain("run%3Fquery");
  });

  it("RHESSYS_SPATIAL_TILE encodes both runId and filename", () => {
    const url = API_ENDPOINTS.RHESSYS_SPATIAL_TILE("r 1", "file#2.tif");
    expect(url).toContain("r%201");
    expect(url).toContain("file%232.tif");
  });

  it("RHESSYS_OUTPUTS_TILE encodes runId, scenario, and variable", () => {
    const url = API_ENDPOINTS.RHESSYS_OUTPUTS_TILE("r/1", "s&2", "v=3");
    expect(url).toContain("r%2F1");
    expect(url).toContain("s%262");
    expect(url).toContain("v%3D3");
  });

  it("RHESSYS_OUTPUTS_GEOMETRY encodes runId and scale", () => {
    const url = API_ENDPOINTS.RHESSYS_OUTPUTS_GEOMETRY("r 1", "hill slope");
    expect(url).toContain("r%201");
    expect(url).toContain("hill%20slope");
  });

  it("QUERY_RUN does NOT encode batchPath (multi-segment path)", () => {
    const batchPath = "lt:watar_22_3/wepp/runs/foo";
    const url = API_ENDPOINTS.QUERY_RUN(batchPath);
    // slashes should remain intact
    expect(url).toContain(batchPath);
  });

  it("clean IDs pass through unchanged", () => {
    const url = API_ENDPOINTS.WATERSHED("simple-id-123");
    expect(url).toContain("/watershed/simple-id-123/");
  });
});
