import { ChangeEvent, useState } from "react";
import { useAppStore } from "../../../../store/store";
import type { ActiveDataLayer } from "../../../../store/slices/layersSlice";
import DataLayersTabContent from "./DataLayersTabContent";

import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";

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
    "&:hover": {
      background: theme.palette.text.secondary,
    },
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 600,
  },
}));

const DATA_LAYER_IDS: Record<string, ActiveDataLayer> = {
  landuse: "landuse",
  vegetationCover: "vegetationCover",
  soilBurnSeverity: "soilBurnSeverity",
};

export default function DataLayersControl() {
  const { classes } = useStyles();

  const queryClient = useQueryClient();

  const { setActiveDataLayer, setSubcatchment, setChannels } = useAppStore();

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("WEPP");

  const navTabs = ["WEPP", "Watershed Data"];

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;

    if (!checked) {
      if (id === "subcatchment") {
        queryClient.cancelQueries({ queryKey: ["subcatchments"] });
      } else if (id === "channels") {
        queryClient.cancelQueries({ queryKey: ["channels"] });
      }
    }

    // Handle independent overlays
    if (id === "subcatchment") {
      return setSubcatchment(checked);
    }
    if (id === "channels") {
      return setChannels(checked);
    }

    // Handle mutually exclusive data layers
    if (id in DATA_LAYER_IDS) {
      return setActiveDataLayer(checked ? DATA_LAYER_IDS[id] : "none");
    }
  };

  return (
    <div className={classes.root}>
      <div>
        <div className={classes.header} onClick={toggleOpen}>
          <div>{activeTab}</div>
          <span className={classes.chevron}>
            {isOpen ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
          </span>
        </div>
        {isOpen && (
          <Paper className={classes.tabContent}>
            <DataLayersTabContent
              activeTab={activeTab}
              handleChange={handleChange}
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
                      toggleOpen();
                    } else {
                      setActiveTab(tab);
                      setIsOpen(true);
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
