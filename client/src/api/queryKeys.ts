/**
 * Centralized React Query key factory.
 *
 * Every useQuery / queryClient call should reference keys from here
 * so that cache invalidation, prefetching, and cancellation stay in sync.
 *
 * Convention: each domain returns a plain object whose methods produce
 * readonly tuple keys.  The `all` key is the broadest scope for that domain,
 * useful for bulk invalidation (e.g. queryClient.invalidateQueries(queryKeys.watersheds.all)).
 */
export const queryKeys = {
  watersheds: {
    all: ["watersheds"],
  },
  subcatchments: {
    all: ["subcatchments"],
    byRun: (runId: string) => ["subcatchments", runId],
  },
  channels: {
    all: ["channels"],
    byRun: (runId: string) => ["channels", runId],
  },
  landuse: {
    undisturbed: (runId: string) => ["landuse-undisturbed", runId],
  },
  rapChoropleth: {
    byParams: (
      runId: string,
      type: string,
      year: number | null | undefined,
      bands: number | number[],
    ) => ["rap-choropleth", runId, type, year, bands],
  },
  sbsColormap: {
    byMode: (mode: string) => ["sbs-colormap", mode],
  },
  scenarioData: {
    byScenario: (runId: string, scenario: string) => [
      "scenarioData",
      runId,
      scenario,
    ],
  },
  scenariosSummary: {
    byRun: (runId: string) => ["scenariosSummary", runId],
  },
  rhessysSpatialInputs: {
    byRun: (runId: string) => ["rhessysSpatialInputs", runId],
  },
  rhessysOutputs: {
    byRun: (runId: string) => ["rhessysOutputs", runId],
  },
  rhessysChoropleth: {
    byParams: (
      runId: string,
      scenario: string,
      variable: string,
      spatialScale: string,
      year: number,
    ) => ["rhessys-choropleth", runId, scenario, variable, spatialScale, year],
  },
  rhessysGeometry: {
    /** `patchGeometryRevision`: null for hillslope; `"1985"` / `"2021"` for patch. */
    byScale: (
      runId: string,
      spatialScale: string,
      patchGeometryRevision?: "1985" | "2021" | null,
    ) => [
      "rhessys-geometry",
      runId,
      spatialScale,
      patchGeometryRevision ?? null,
    ],
  },
  rhessysTimeSeries: {
    byParams: (
      runId: string,
      scenario: string,
      variable: string,
      spatialScale: string,
    ) => ["rhessys-timeseries", runId, scenario, variable, spatialScale],
  },
} as const;
