/**
 * useLayerToggle — encapsulates the toggle + side-effect logic for
 * enabling / disabling map data layers.
 */
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { useWatershed } from "../contexts/WatershedContext";
import { ALL_LAYER_IDS, type LayerId } from "../layers/types";

export function useLayerToggle() {
  const queryClient = useQueryClient();
  const { dispatchLayerAction, clearSelectedHillslope } = useWatershed();

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      if (!ALL_LAYER_IDS.includes(id as LayerId)) return;
      const layerId = id as LayerId;

      dispatchLayerAction({ type: "TOGGLE", id: layerId, on: checked });

      if (id === "subcatchment" && !checked) {
        queryClient.cancelQueries({ queryKey: queryKeys.subcatchments.all });
        clearSelectedHillslope();
      }
      if (id === "channels" && !checked) {
        queryClient.cancelQueries({ queryKey: queryKeys.channels.all });
      }
    },
    [dispatchLayerAction, queryClient, clearSelectedHillslope],
  );

  return toggle;
}
