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
    all: ["watersheds"] as const,
  },
  subcatchments: {
    all: ["subcatchments"] as const,
    byRun: (runId: string) => ["subcatchments", runId] as const,
  },
  channels: {
    all: ["channels"] as const,
    byRun: (runId: string) => ["channels", runId] as const,
  },
  landuse: {
    undisturbed: (runId: string) => ["landuse-undisturbed", runId] as const,
  },
  rapChoropleth: {
    byParams: (
      runId: string,
      type: string,
      year: number | null | undefined,
      bands: number | number[],
    ) => ["rap-choropleth", runId, type, year, bands] as const,
  },
  sbsColormap: {
    byMode: (mode: string) => ["sbs-colormap", mode] as const,
  },
  scenarioData: {
    byScenario: (runId: string, scenario: string) =>
      ["scenarioData", runId, scenario] as const,
  },
  scenariosSummary: {
    byRun: (runId: string) => ["scenariosSummary", runId] as const,
  },
  rhessysSpatialInputs: {
    byRun: (runId: string) => ["rhessysSpatialInputs", runId] as const,
  },
  rhessysOutputs: {
    byRun: (runId: string) => ["rhessysOutputs", runId] as const,
  },
  rhessysChoropleth: {
    byParams: (
      runId: string,
      scenario: string,
      variable: string,
      spatialScale: string,
      year: number,
    ) =>
      [
        "rhessys-choropleth",
        runId,
        scenario,
        variable,
        spatialScale,
        year,
      ] as const,
  },
  rhessysGeometry: {
    byScale: (runId: string, spatialScale: string) =>
      ["rhessys-geometry", runId, spatialScale] as const,
  },
  rhessysTimeSeries: {
    byParams: (
      runId: string,
      scenario: string,
      variable: string,
      spatialScale: string,
    ) =>
      ["rhessys-timeseries", runId, scenario, variable, spatialScale] as const,
  },
} as const;
