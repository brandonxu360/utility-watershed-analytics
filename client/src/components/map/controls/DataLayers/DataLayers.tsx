import { useState } from "react";
import { useWatershed } from "../../../../contexts/WatershedContext";
import DataLayersTabContent from "./DataLayersTabContent";

import {
  FaChevronUp,
  FaChevronDown,
  FaWater,
  FaGlobe,
  FaTree,
  FaFireAlt,
} from "react-icons/fa";

import { tss } from "../../../../utils/tss";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import { useQueryClient } from "@tanstack/react-query";

const useStyles = tss.create(({ theme }) => ({
  root: {
    display: "flex",
    flexDirection: "column-reverse",
    position: "fixed",
    right: "10px",
    bottom: "25px",
    width: "275px",
    zIndex: 10000,
  },
  header: {
    background: theme.palette.primary.dark,
    display: "flex",
    alignContent: "center",
    justifyContent: "space-between",
    padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
    fontSize: theme.typography.subtitle2.fontSize,
    fontWeight: 700,
    color: theme.palette.primary.contrastText,
    cursor: "pointer",
    borderBottom: `1px solid ${theme.palette.surface.light}`,
    height: "40px",
  },
  chevron: {
    fontSize: theme.typography.subtitle2.fontSize,
    color: theme.palette.primary.contrastText,
  },
  tabContent: {
    background: theme.palette.primary.contrastText,
    padding: 0,
    borderRadius: 0,
  },
  heading: {
    fontSize: theme.typography.subtitle2.fontSize,
    fontWeight: 600,
    color: theme.palette.primary.dark,
    padding: `${theme.spacing(1)} ${theme.spacing(2)} 0 ${theme.spacing(2)}`,
  },
  bottomNav: {
    background: theme.palette.primary.contrastText,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: `${theme.spacing(1)} 0`,
    height: "40px",
  },
  navContainer: {
    display: "flex",
    gap: theme.spacing(3),
  },
  navButton: {
    width: "40px",
    height: "40px",
    display: "flex",
    color: theme.palette.accent.main,
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.text.secondary,
    },
  },
}));

/**
 * DataLayersControl - toggles visibility of map data layers.
 *
 * All toggle logic now flows through `dispatchLayerAction` which delegates
 * to the pure rule engine. No more scattered side-effect handlers.
 */
export default function DataLayersControl() {
  const { classes } = useStyles();

  const queryClient = useQueryClient();

  const { dispatchLayerAction, clearSelectedHillslope } = useWatershed();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("WEPP Hillslopes");

  const navTabs = [
    { key: "WEPP Hillslopes", icon: <FaWater title="WEPP Hillslopes" /> },
    { key: "Surface Data", icon: <FaGlobe title="Coverage" /> },
    { key: "Coverage", icon: <FaTree title="Vegetation" /> },
    { key: "Soil Burn", icon: <FaFireAlt title="Soil Burn" /> },
  ];

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleToggle = (id: string, checked: boolean) => {
    // Map checkbox DOM ids to LayerIds
    const layerIdMap: Record<
      string,
      import("../../../../layers/types").LayerId
    > = {
      subcatchment: "subcatchment",
      channels: "channels",
      landuse: "landuse",
      soilBurnSeverity: "sbs",
      fireSeverity: "fireSeverity",
    };

    const layerId = layerIdMap[id];
    if (!layerId) return;

    // Dispatch the toggle — rule engine handles requires/excludes/dependents
    dispatchLayerAction({ type: "TOGGLE", id: layerId, on: checked });

    // Side effects that are outside the layer system's scope
    if (id === "subcatchment" && !checked) {
      queryClient.cancelQueries({ queryKey: ["subcatchments"] });
      clearSelectedHillslope();
      // Panel closes automatically: subcatchment off → choropleth blocked → isEffective false
    }

    if (id === "channels" && !checked) {
      queryClient.cancelQueries({ queryKey: ["channels"] });
    }
  };

  return (
    <div className={classes.root}>
      <div>
        <div className={classes.header} onClick={toggleOpen}>
          Data Layers{" "}
          <span className={classes.chevron}>
            {isOpen ? <FaChevronDown /> : <FaChevronUp />}
          </span>
        </div>
        {isOpen && (
          <Paper className={classes.tabContent}>
            <div className={classes.heading}>{activeTab}</div>
            <DataLayersTabContent
              activeTab={activeTab}
              handleToggle={handleToggle}
            />
          </Paper>
        )}
        <div className={classes.bottomNav}>
          <div className={classes.navContainer}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <IconButton
                  key={tab.key}
                  className={`${classes.navButton}${isActive ? " active" : ""}`}
                  onClick={() => {
                    if (isActive) {
                      toggleOpen();
                    } else {
                      setActiveTab(tab.key);
                      setIsOpen(true);
                    }
                  }}
                  size="small"
                  data-layer-tab={tab.key}
                >
                  {tab.icon}
                </IconButton>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
