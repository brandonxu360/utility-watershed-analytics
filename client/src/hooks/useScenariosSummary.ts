import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import {
  fetchScenariosSummary,
  type ScenarioSummaryRow,
} from "../api/scenarioApi";

export function useScenariosSummary(runId: string | null) {
  return useQuery<ScenarioSummaryRow[]>({
    queryKey: queryKeys.scenariosSummary.byRun(runId ?? ""),
    queryFn: ({ signal }) => fetchScenariosSummary(runId!, signal),
    enabled: !!runId,
    retry: 1,
  });
}
