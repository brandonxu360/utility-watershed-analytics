import { describe, it, expect } from "vitest";
import {
  buildHillslopeTooltip,
  buildWatershedTooltip,
} from "../utils/tooltipContent";
import type { SubcatchmentProperties } from "../types/SubcatchmentProperties";
import type { WatershedProperties } from "../types/WatershedProperties";
import type { ScenarioDataRow } from "../api/types/scenario";

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
      expect(html).toContain("2010");
      expect(html).toContain("Shrub Cover:");
      expect(html).toContain("42.6%");
    });

    it("uses correct label for tree band", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "tree",
        year: 2020,
        value: 15,
      });
      expect(html).toContain("2020");
      expect(html).toContain("Tree Cover:");
    });

    it("uses correct label for all band", () => {
      const html = buildHillslopeTooltip(baseProps, {
        layer: "choropleth",
        bands: "all",
        year: 1999,
        value: 60,
      });
      expect(html).toContain("1999");
      expect(html).toContain("Total Cover:");
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

describe("buildWatershedTooltip", () => {
  it("falls back to 'Unknown Watershed' when props are null", () => {
    const html = buildWatershedTooltip(null);
    expect(html).toContain("Unknown Watershed");
  });

  it("falls back to 'Unknown Watershed' when pws_name is missing", () => {
    const html = buildWatershedTooltip({});
    expect(html).toContain("Unknown Watershed");
  });

  it("renders pws_name when provided", () => {
    const html = buildWatershedTooltip({ pws_name: "Cedar River" });
    expect(html).toContain("Cedar River");
  });

  it("renders county and state when both present", () => {
    const props: Partial<WatershedProperties> = {
      pws_name: "Cedar River",
      county_nam: "King County",
      state: "WA",
    };
    const html = buildWatershedTooltip(props);
    expect(html).toContain("King County, WA");
  });

  it("renders only county when state is absent", () => {
    const props: Partial<WatershedProperties> = {
      pws_name: "Cedar River",
      county_nam: "King County",
    };
    const html = buildWatershedTooltip(props);
    expect(html).toContain("King County");
    expect(html).not.toContain(",");
  });

  it("omits location line entirely when both county and state are absent", () => {
    const html = buildWatershedTooltip({ pws_name: "Cedar River" });
    expect(html).not.toMatch(/<br\s*\/?>/i);
  });

  it("wraps output in tooltip-bold span", () => {
    const html = buildWatershedTooltip({ pws_name: "Cedar River" });
    expect(html).toMatch(/^<span class="tooltip-bold">.*<\/span>$/s);
  });

  describe("XSS prevention", () => {
    /**
     * These tests parse the tooltip output as HTML the same way Leaflet does
     * (via innerHTML) and assert that no unexpected elements were injected.
     * A string-only check (toContain("&lt;script&gt;")) can mask double-escaping
     * bugs; DOM parsing is the actual proof.
     */
    it("does not inject elements from a malicious pws_name", () => {
      const output = buildWatershedTooltip({
        pws_name: "<img src=x onerror=alert(1)>",
      });
      const container = document.createElement("div");
      container.innerHTML = output;
      expect(container.querySelectorAll("img")).toHaveLength(0);
      expect(container.querySelector("strong")?.textContent).toBe(
        "<img src=x onerror=alert(1)>",
      );
    });

    it("does not inject elements from a malicious county_nam", () => {
      const output = buildWatershedTooltip({
        pws_name: "Safe Name",
        county_nam: "<script>alert(1)</script>",
      });
      const container = document.createElement("div");
      container.innerHTML = output;
      expect(container.querySelectorAll("script")).toHaveLength(0);
    });

    it("preserves the raw text content after round-tripping through innerHTML", () => {
      const payload = `<b>bold</b> & "quoted" O'Brien`;
      const output = buildWatershedTooltip({ pws_name: payload });
      const container = document.createElement("div");
      container.innerHTML = output;
      expect(container.querySelector("strong")?.textContent).toBe(payload);
    });
  });
});
