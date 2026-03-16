import { useParams } from "@tanstack/react-router";

/**
 * Returns the current watershed run ID from the URL, or `null` if not
 * on a watershed route.
 *
 * Wraps the repeated `useParams({ from: "/watershed/$webcloudRunId", … })`
 * boilerplate so every consumer gets consistent behaviour.
 */
export function useRunId(): string | null {
  return (
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null
  );
}
