import { FC } from "react";
import { ChangeEvent } from "react";

import {
  useAppStore,
  AVAILABLE_SCENARIOS,
  SCENARIO_VARIABLES,
  SCENARIO_VARIABLE_CONFIG,
  type ScenarioType,
  type ScenarioVariableType,
} from "../../../../store/store";

import {
  useScenarioData,
  formatScenarioLabel,
} from "../../../../hooks/useScenarioData";

import { tss } from "../../../../utils/tss";
import { Typography } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";

const useStyles = tss.create(({ theme }) => ({
  layers: {
    maxHeight: "375px",
    overflowY: "auto",
    padding: `${theme.spacing(0.5)} 0 ${theme.spacing(1)} 0`,
  },
  heading: {
    fontSize: theme.typography.subtitle2.fontSize,
    fontWeight: 600,
    color: theme.palette.primary.dark,
    padding: `${theme.spacing(1)} ${theme.spacing(2)} 0 ${theme.spacing(2)}`,
  },
  layer: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
  },
  layerTitle: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.dark,
    flex: 1,
    paddingLeft: theme.spacing(1.5),
  },
  layerCheckbox: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.dark,
    "&.Mui-disabled": {
      color: theme.palette.muted.main,
      opacity: 0.85,
    },
  },
  variableRow: {
    display: "flex",
    alignItems: "center",
    padding: `${theme.spacing(0.25)} ${theme.spacing(2)} ${theme.spacing(0.25)} ${theme.spacing(4)}`,
  },
  variableTitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.primary.dark,
    flex: 1,
    paddingLeft: theme.spacing(1),
  },
  helpIcon: {
    color: theme.palette.accent.main,
    fontSize: "16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
}));

type DataLayersTabContentProps = {
  activeTab: string;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const DataLayersTabContent: FC<DataLayersTabContentProps> = ({
  activeTab,
  handleChange,
}) => {
  const { classes } = useStyles();

  const {
    activeDataLayer,
    subcatchment,
    channels,
    selectedScenario,
    scenarioVariable,
    setSelectedScenario,
    setScenarioVariable,
  } = useAppStore();

  const { isLoading: scenarioLoading } = useScenarioData();

  const landuse = activeDataLayer === "landuse";
  const vegetation = activeDataLayer === "vegetationCover";
  const sbsEnabled = activeDataLayer === "soilBurnSeverity";
  const hasActiveDataLayer = activeDataLayer !== "none";
  const hasScenario = selectedScenario !== null;

  const handleScenarioChange = (scenario: ScenarioType) => {
    if (selectedScenario === scenario) {
      setSelectedScenario(null);
    } else {
      setSelectedScenario(scenario);
    }
  };

  const handleVariableChange = (variable: ScenarioVariableType) => {
    setScenarioVariable(variable);
  };

  return (
    <div className={classes.layers}>
      {activeTab === "WEPP" && (
        <>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Subcatchments
            </Typography>
            <Checkbox
              checked={subcatchment}
              onChange={handleChange}
              disabled={hasActiveDataLayer || hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "subcatchment" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>Channels</Typography>
            <Checkbox
              checked={channels}
              onChange={handleChange}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "channels" } }}
            />
          </div>

          {/* Scenario toggles */}
          {AVAILABLE_SCENARIOS.map((scenario) => (
            <div key={scenario} className={classes.layer}>
              <Typography className={classes.layerTitle}>
                {formatScenarioLabel(scenario)}
              </Typography>
              <Checkbox
                checked={selectedScenario === scenario}
                onChange={() => handleScenarioChange(scenario)}
                disabled={scenarioLoading || hasActiveDataLayer}
                className={classes.layerCheckbox}
                slotProps={{ input: { id: scenario } }}
              />
            </div>
          ))}

          {/* Variable selection - shown when a scenario is active */}
          {hasScenario && (
            <>
              <Typography className={classes.heading}>Variable</Typography>
              {SCENARIO_VARIABLES.map((variable) => (
                <div key={variable} className={classes.variableRow}>
                  <Typography className={classes.variableTitle}>
                    {SCENARIO_VARIABLE_CONFIG[variable].label}
                  </Typography>
                  <Radio
                    checked={scenarioVariable === variable}
                    onChange={() => handleVariableChange(variable)}
                    size="small"
                    slotProps={{ input: { id: `variable-${variable}` } }}
                  />
                </div>
              ))}
            </>
          )}
        </>
      )}
      {activeTab === "Watershed Data" && (
        <>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Land Use (2025)
            </Typography>
            <Checkbox
              checked={landuse}
              onChange={handleChange}
              disabled={vegetation || hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "landuse" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Vegetation Cover
            </Typography>
            <Checkbox
              checked={vegetation}
              onChange={handleChange}
              disabled={hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "vegetationCover" } }}
            />
          </div>
          <div className={classes.layer}>
            <Typography className={classes.layerTitle}>
              Soil Burn Severity
            </Typography>
            <Checkbox
              checked={sbsEnabled}
              onChange={handleChange}
              disabled={hasScenario}
              className={classes.layerCheckbox}
              slotProps={{ input: { id: "soilBurnSeverity" } }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DataLayersTabContent;
