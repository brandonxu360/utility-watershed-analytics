import { useState } from "react";
import { useWatershed } from "../../../../contexts/WatershedContext";
import { ALL_LAYER_IDS } from "../../../../layers/types";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { tss } from "../../../../utils/tss";
import { useQueryClient } from "@tanstack/react-query";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DataLayersTabContent from "./DataLayersTabContent";
import type { LayerId } from "../../../../layers/types";

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
    padding: `${theme.spacing(1.25)} ${theme.spacing(2)}`,
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
    gap: theme.spacing(6),
  },
  navButton: {
    height: "40px",
    display: "flex",
    color: theme.palette.accent.main,
    cursor: "pointer",
    border: "none",
    borderRadius: 0,
    "&:hover, &.active": {
      background: theme.palette.text.secondary,
    },
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 600,
  },
}));

/**
 * DataLayersControl - toggles visibility of map data layers.
 */
export default function DataLayersControl() {
  const { classes } = useStyles();

  const queryClient = useQueryClient();

  const { dispatchLayerAction, clearSelectedHillslope } = useWatershed();

  const [activeTab, setActiveTab] = useState<string | null>("WEPP");

  const navTabs = ["WEPP", "Watershed Data"];

  const handleToggle = (id: string, checked: boolean) => {
    if (!ALL_LAYER_IDS.includes(id as LayerId)) return;
    const layerId = id as LayerId;

    dispatchLayerAction({ type: "TOGGLE", id: layerId, on: checked });

    if (id === "subcatchment" && !checked) {
      queryClient.cancelQueries({ queryKey: ["subcatchments"] });
      clearSelectedHillslope();
    }

    if (id === "channels" && !checked) {
      queryClient.cancelQueries({ queryKey: ["channels"] });
    }
  };

  return (
    <div className={classes.root}>
      <div>
        <div
          className={classes.header}
          onClick={() => setActiveTab((prev) => (prev ? null : "WEPP"))}
        >
          <div>{activeTab ?? "WEPP"}</div>
          <span className={classes.chevron}>
            {activeTab ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
          </span>
        </div>
        {activeTab && (
          <Paper className={classes.tabContent}>
            <DataLayersTabContent
              activeTab={activeTab}
              handleToggle={handleToggle}
            />
          </Paper>
        )}
        <div className={classes.bottomNav}>
          <div className={classes.navContainer}>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <IconButton
                  key={tab}
                  className={`${classes.navButton}${isActive ? " active" : ""}`}
                  onClick={() => {
                    if (isActive) {
                      setActiveTab(null);
                    } else {
                      setActiveTab(tab);
                    }
                  }}
                  size="small"
                  data-layer-tab={tab}
                >
                  {tab}
                </IconButton>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
