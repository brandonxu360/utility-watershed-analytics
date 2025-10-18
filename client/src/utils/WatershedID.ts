import { useEffect } from "react";
import { useMatch } from "@tanstack/react-router";
import { watershedOverviewRoute } from "../routes/router";
import { useWatershedIDStore } from "../store/WatershedIDStore";

export function useWatershedID(): void {
    const setId = useWatershedIDStore((s) => s.setId);
    const match = useMatch({ from: watershedOverviewRoute.id, shouldThrow: false });
    const watershedId: string | null = match?.params.webcloudRunId ?? null;

    useEffect(() => {
        setId(watershedId);
    }, [watershedId, setId]);
}