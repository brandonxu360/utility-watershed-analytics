import { describe, it, expect } from "vitest";
import { buildHillslopeTooltip } from "../utils/tooltipContent";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { ScenarioDataRow } from "../layers/scenario";

const baseProps: Partial<SubcatchmentProperties> = {
  topazid: 101,
  weppid: 202,
  width: 10,
  length: 20,
  hillslope_area: 10000,
  slope_scalar: 0.25,
  aspect: 1.23,
  simple_texture: "Loam",
};

const scenarioRow: ScenarioDataRow = {
  wepp_id: 202,
  runoff: 12.34,
  subrunoff: 3.21,
  baseflow: 1.05,
  soil_loss: 0.56,
  sediment_deposition: 0.33,
  sediment_yield: 7.89,
  hillslope_area: 5000.5,
};

describe("buildHillslopeTooltip", () => {
  it("shows identifiers in all cases", () => {
    const html = buildHillslopeTooltip(baseProps);
    expect(html).toContain("TopazID: 101");
    expect(html).toContain("WeppID: 202");
  });

  it("shows default geometry fields when no scenario data", () => {
    const html = buildHillslopeTooltip(baseProps);
    expect(html).toContain("Width:");
    expect(html).toContain("10.00");
    expect(html).toContain("Length:");
    expect(html).toContain("20.00");
    expect(html).toContain("10000 m²");
    expect(html).toContain("Slope:");
    expect(html).toContain("0.25");
    expect(html).toContain("Aspect:");
    expect(html).toContain("1.23");
    expect(html).toContain("Soil:");
    expect(html).toContain("Loam");
  });

  it("shows scenario data when provided", () => {
    const html = buildHillslopeTooltip(baseProps, scenarioRow);
    expect(html).toContain("Runoff Volume:");
    expect(html).toContain("12.34");
    expect(html).toContain("Soil Loss:");
    expect(html).toContain("0.56");
    expect(html).toContain("Sediment Deposition:");
    expect(html).toContain("0.33");
    expect(html).toContain("Sediment Yield:");
    expect(html).toContain("7.89");
    expect(html).toContain("Area:");
    expect(html).toContain("5000.50");
  });

  it("hides geometry fields when scenario data is present", () => {
    const html = buildHillslopeTooltip(baseProps, scenarioRow);
    expect(html).not.toContain("Slope:");
    expect(html).not.toContain("Aspect:");
    expect(html).not.toContain("Soil:");
  });

  it("renders N/A for missing properties without scenario data", () => {
    const html = buildHillslopeTooltip({});
    expect(html).toContain("TopazID: N/A");
    expect(html).toContain("WeppID: N/A");
    expect(html).toContain("N/A m");
    expect(html).toContain("N/A m²");
  });

  it("wraps output in tooltip-bold span", () => {
    const html = buildHillslopeTooltip(baseProps);
    expect(html).toMatch(/^<span class="tooltip-bold">.*<\/span>$/s);
  });

  it("treats null scenarioRow same as undefined", () => {
    const withNull = buildHillslopeTooltip(baseProps, null);
    const withUndefined = buildHillslopeTooltip(baseProps);
    expect(withNull).toBe(withUndefined);
  });
});
