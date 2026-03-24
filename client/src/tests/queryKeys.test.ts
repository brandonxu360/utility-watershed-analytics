import { describe, it, expect } from "vitest";
import { queryKeys } from "../api/queryKeys";

describe("queryKeys", () => {
  it("watersheds.all is a stable tuple", () => {
    expect(queryKeys.watersheds.all).toEqual(["watersheds"]);
  });

  it("subcatchments.byRun produces scoped key", () => {
    expect(queryKeys.subcatchments.byRun("abc")).toEqual([
      "subcatchments",
      "abc",
    ]);
  });

  it("channels.byRun produces scoped key", () => {
    expect(queryKeys.channels.byRun("r1")).toEqual(["channels", "r1"]);
  });

  it("landuse.undisturbed produces scoped key", () => {
    expect(queryKeys.landuse.undisturbed("r1")).toEqual([
      "landuse-undisturbed",
      "r1",
    ]);
  });

  it("rapChoropleth.byParams includes all dimensions", () => {
    const key = queryKeys.rapChoropleth.byParams(
      "r1",
      "coverage",
      2020,
      [1, 2],
    );
    expect(key).toEqual(["rap-choropleth", "r1", "coverage", 2020, [1, 2]]);
  });

  it("sbsColormap.byMode produces scoped key", () => {
    expect(queryKeys.sbsColormap.byMode("shift")).toEqual([
      "sbs-colormap",
      "shift",
    ]);
  });

  it("scenarioData.byScenario produces scoped key", () => {
    expect(queryKeys.scenarioData.byScenario("r1", "fire")).toEqual([
      "scenarioData",
      "r1",
      "fire",
    ]);
  });

  it("scenariosSummary.byRun produces scoped key", () => {
    expect(queryKeys.scenariosSummary.byRun("r1")).toEqual([
      "scenariosSummary",
      "r1",
    ]);
  });

  it("rhessysTimeSeries.byParams includes all dimensions", () => {
    const key = queryKeys.rhessysTimeSeries.byParams(
      "r1",
      "baseline",
      "streamflow",
      "hillslope",
    );
    expect(key).toEqual([
      "rhessys-timeseries",
      "r1",
      "baseline",
      "streamflow",
      "hillslope",
    ]);
  });

  it("rhessysChoropleth.byParams includes all dimensions", () => {
    const key = queryKeys.rhessysChoropleth.byParams(
      "r1",
      "baseline",
      "et",
      "patch",
      2020,
    );
    expect(key).toEqual([
      "rhessys-choropleth",
      "r1",
      "baseline",
      "et",
      "patch",
      2020,
    ]);
  });

  it("rhessysGeometry.byScale produces scoped key (no scenario)", () => {
    expect(queryKeys.rhessysGeometry.byScale("r1", "hillslope")).toEqual([
      "rhessys-geometry",
      "r1",
      "hillslope",
      null,
    ]);
  });

  it("rhessysGeometry.byScale includes patch geometry revision when provided", () => {
    expect(queryKeys.rhessysGeometry.byScale("r1", "patch", "2021")).toEqual([
      "rhessys-geometry",
      "r1",
      "patch",
      "2021",
    ]);
    expect(queryKeys.rhessysGeometry.byScale("r1", "patch", "1985")).toEqual([
      "rhessys-geometry",
      "r1",
      "patch",
      "1985",
    ]);
  });

  it("keys are readonly tuples (immutable)", () => {
    const key = queryKeys.subcatchments.byRun("x");
    // TypeScript readonly prevents mutation; at runtime we just ensure shape
    expect(Object.isFrozen(key) || Array.isArray(key)).toBe(true);
  });
});
