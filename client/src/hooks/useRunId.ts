import { useParams } from "@tanstack/react-router";

export function useRunId(): string | null {
  return (
    useParams({
      from: "/watershed/$webcloudRunId",
      select: (params) => params?.webcloudRunId,
      shouldThrow: false,
    }) ?? null
  );
}
