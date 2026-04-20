import { useWatershed } from "../../contexts/WatershedContext";
import { useRhessysOutputsData } from "../../hooks/useRhessysOutputsData";
import { resolveBottomPanel } from "../../layers/evaluate";
import { RhessysTimeSeries } from "./RhessysTimeSeries";
import { ScenariosTable } from "./ScenariosTable";
import BottomPanel from "./BottomPanel";
import VegetationCover from "./VegetationCover";

export default function ActiveBottomPanel({ runId }: { runId: string | null }) {
  const { effective } = useWatershed();
  const { hasChoroplethData } = useRhessysOutputsData(runId);

  const panelKey = resolveBottomPanel(effective, runId, hasChoroplethData);
  if (!panelKey) return null;

  const content = {
    vegetationCover: <VegetationCover />,
    rhessysTimeSeries: <RhessysTimeSeries />,
    scenarios: <ScenariosTable />,
  }[panelKey];

  return (
    <BottomPanel key={panelKey} isOpen>
      {content}
    </BottomPanel>
  );
}
