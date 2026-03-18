/**
 * useLayerToggle — encapsulates the toggle + side-effect logic for
 * enabling / disabling map data layers.
 *
 * Query cancellation on toggle-off is handled declaratively by useLayerQuery
 * (each data hook passes its queryKey, and cancellation fires automatically
 * when `enabled` transitions from true → false).
 */
import { useCallback } from "react";
import { useWatershed } from "../contexts/WatershedContext";
import { ALL_LAYER_IDS, type LayerId } from "../layers/types";

export function useLayerToggle() {
  const { dispatchLayerAction, clearSelectedHillslope } = useWatershed();

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      if (!ALL_LAYER_IDS.includes(id as LayerId)) return;
      const layerId = id as LayerId;

      dispatchLayerAction({ type: "TOGGLE", id: layerId, on: checked });

      if (id === "subcatchment" && !checked) {
        clearSelectedHillslope();
      }
    },
    [dispatchLayerAction, clearSelectedHillslope],
  );

  return toggle;
}
