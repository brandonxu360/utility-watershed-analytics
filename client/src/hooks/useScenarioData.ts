import { useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { toast } from "react-toastify";

import {
    useAppStore,
    type ScenarioType,
    type ScenarioDataRow,
    type ScenarioVariableType,
    SCENARIO_VARIABLE_CONFIG,
} from "../store/store";
import { fetchScenarioData } from "../api/scenarioApi";
import { computeRobustRange } from "../utils/colormap";

/** Format scenario name for display (e.g., "thinning_40_75" -> "Thinning 40-75") */
export const formatScenarioLabel = (scenario: ScenarioType): string =>
    scenario
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
        .replace(/(\d+)\s+(\d+)/g, "$1-$2");

export interface UseScenarioDataResult {
    isLoading: boolean;
    hasData: boolean;
    dataByWeppId: Map<number, ScenarioDataRow>;
    selectedScenario: ScenarioType | null;
    scenarioVariable: ScenarioVariableType;
    variableConfig: (typeof SCENARIO_VARIABLE_CONFIG)[ScenarioVariableType];
    range: { min: number; max: number } | null;
}

/**
 * Hook to fetch scenario WEPP loss data.
 * Uses react-query for caching, shows toast on errors.
 */
export function useScenarioData(): UseScenarioDataResult {
    const runId =
        useParams({
            from: "/watershed/$webcloudRunId",
            select: (params) => params?.webcloudRunId,
            shouldThrow: false,
        }) ?? null;

    const selectedScenario = useAppStore((s) => s.selectedScenario);
    const scenarioVariable = useAppStore((s) => s.scenarioVariable);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["scenarioData", runId, selectedScenario],
        queryFn: () =>
            fetchScenarioData({ runId: runId!, scenario: selectedScenario! }),
        enabled: !!runId && !!selectedScenario,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    // Track shown errors to prevent duplicate toasts
    const shownErrorRef = useRef<string | null>(null);
    useEffect(() => {
        const key = `${selectedScenario}-error`;
        if (isError && selectedScenario && shownErrorRef.current !== key) {
            shownErrorRef.current = key;
            toast.error(
                `No data available for ${formatScenarioLabel(selectedScenario)}`,
            );
        } else if (!isError) {
            shownErrorRef.current = null;
        }
    }, [isError, selectedScenario]);

    const dataByWeppId = useMemo(() => {
        const map = new Map<number, ScenarioDataRow>();
        if (data) {
            for (const row of data) {
                map.set(row.wepp_id, row);
            }
        }
        return map;
    }, [data]);

    // Compute range based on selected variable
    const range = useMemo(() => {
        if (dataByWeppId.size === 0) return null;
        const values = Array.from(dataByWeppId.values()).map(
            (row) => row[scenarioVariable],
        );
        return computeRobustRange(values);
    }, [dataByWeppId, scenarioVariable]);

    const variableConfig = SCENARIO_VARIABLE_CONFIG[scenarioVariable];

    return {
        isLoading,
        hasData: dataByWeppId.size > 0,
        dataByWeppId,
        selectedScenario,
        scenarioVariable,
        variableConfig,
        range,
    };
}

export default useScenarioData;
