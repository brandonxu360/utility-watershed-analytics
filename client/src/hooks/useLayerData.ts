import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useLayerQuery } from "./useLayerQuery";
import type { LayerId } from "../layers/types";

export interface UseLayerDataOpts<T> {
  hasDataFn?: (data: T) => boolean;
  cancellationKey?: QueryKey;
  retry?: number | boolean;
}

function defaultHasData<T>(data: T): boolean {
  if (data == null) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === "object") return Object.keys(data as object).length > 0;
  return true;
}

export function useLayerData<T>(
  layerId: LayerId,
  queryKey: QueryKey,
  fetchFn: (signal: AbortSignal) => Promise<T>,
  enabled: boolean,
  opts: UseLayerDataOpts<T> = {},
): { data: T | null; isLoading: boolean } {
  const { hasDataFn = defaultHasData, cancellationKey, retry } = opts;

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchFn(signal),
    enabled,
    ...(retry !== undefined ? { retry } : {}),
  });

  const hasData = !error && data != null && hasDataFn(data);

  useLayerQuery(layerId, {
    enabled,
    isLoading,
    hasData,
    queryKey: cancellationKey ?? queryKey,
  });

  return { data: data ?? null, isLoading };
}
