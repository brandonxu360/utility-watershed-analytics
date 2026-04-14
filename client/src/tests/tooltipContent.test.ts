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
    const html = buildHillslopeTooltip(baseProps, { layer: "none" });
    expect(html).toContain("TopazID: 101");
    expect(html).toContain("WeppID: 202");
  });

  it("wraps output in tooltip-bold span", () => {
    const html = buildHillslopeTooltip(baseProps, { layer: "none" });
    expect(html).toMatch(/^<span class="tooltip-bold">.*<\/span>$/s);
  });

  describe('layer: "none" (geometry fallback)', () => {
    it("shows geometry fields", () => {
      const html = buildHillslopeTooltip(baseProps, { layer: "none" });
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

    it("renders N/A for missing properties", () => {
      const html = buildHillslopeTooltip({}, { layer: "none" });
      expect(html).toContain("TopazID: N/A");
      expect(html).toContain("WeppID: N/A");
      expect(html).toContain("N/A m");
      expect(html).toContain("N/A m²");
    });
  });

  describe('layer: "scenario"', () => {
    it("shows only runoff when variable is runoff", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "scenario",
        variable: "runoff",
        row: scenarioRow,
      });
      expect(html).toContain("Runoff Volume:");
      expect(html).toContain("12.34");
      expect(html).toContain("Area:");
      expect(html).toContain("5000.50");
      expect(html).not.toContain("Soil Loss:");
      expect(html).not.toContain("Sediment");
    });

    it("shows sediment fields when variable is sediment_yield", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "scenario",
        variable: "sediment_yield",
        row: scenarioRow,
      });
      expect(html).toContain("Soil Loss:");
      expect(html).toContain("0.56");
      expect(html).toContain("Sediment Deposition:");
      expect(html).toContain("0.33");
      expect(html).toContain("Sediment Yield:");
      expect(html).toContain("7.89");
      expect(html).toContain("Area:");
      expect(html).not.toContain("Runoff Volume:");
    });

    it("hides geometry fields", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "scenario",
        variable: "sediment_yield",
        row: scenarioRow,
      });
      expect(html).not.toContain("Slope:");
      expect(html).not.toContain("Aspect:");
      expect(html).not.toContain("Soil:");
    });
  });

  describe('layer: "landuse"', () => {
    it("shows land use description", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "landuse",
        desc: "Shrub/Scrub",
      });
      expect(html).toContain("Land Use:");
      expect(html).toContain("Shrub/Scrub");
    });

    it("hides geometry fields", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "landuse",
        desc: "Shrub/Scrub",
      });
      expect(html).not.toContain("Width:");
      expect(html).not.toContain("Slope:");
    });
  });

  describe('layer: "choropleth"', () => {
    it("shows band label, year, and percentage", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "shrub",
        year: 2010,
        value: 42.567,
      });
      expect(html).toContain("Shrub Cover (2010):");
      expect(html).toContain("42.6%");
    });

    it("uses correct label for tree band", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "tree",
        year: 2020,
        value: 15,
      });
      expect(html).toContain("Tree Cover (2020):");
    });

    it("uses correct label for all band", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "all",
        year: 1999,
        value: 60,
      });
      expect(html).toContain("Total Cover (1999):");
    });

    it("hides geometry fields", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "all",
        year: 2000,
        value: 50,
      });
      expect(html).not.toContain("Width:");
      expect(html).not.toContain("Slope:");
    });
  });
});
