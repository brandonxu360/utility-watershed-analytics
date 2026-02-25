import { ChangeEvent, useState } from "react";
import { useAppStore } from "../../../../store/store";
import { VegetationCover } from "../../../bottom-panels/VegetationCover";
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

export default function DataLayersControl() {
  const { classes } = useStyles();

  const queryClient = useQueryClient();

  const {
    setSubcatchment,
    setChannels,
    setLanduse,
    setLanduseLegendVisible,
    clearSelectedHillslope,
    closePanel,
    resetOverlays,
    setSbsEnabled,
    setChoroplethType,
    setVegetation,
    openPanel,
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("WEPP");

  const navTabs = ["WEPP", "Watershed Data"];

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;

    switch (id) {
      case "subcatchment": {
        setSubcatchment(checked);
        if (!checked) {
          queryClient.cancelQueries({ queryKey: ["subcatchments"] });
          closePanel();
          setLanduse(false);
          clearSelectedHillslope();
        }
        return;
      }
      case "channels": {
        setChannels(checked);
        if (!checked) {
          queryClient.cancelQueries({ queryKey: ["channels"] });
        }
        return;
      }
      case "landuse": {
        setSubcatchment(checked);
        setLanduse(checked);
        setLanduseLegendVisible(checked);
        if (!checked) {
          resetOverlays();
        }
        return;
      }
      case "vegetationCover": {
        setVegetation(checked);

        if (checked) {
          setSubcatchment(true);
          setLanduse(false);
          setLanduseLegendVisible(false);
          setChoroplethType("vegetationCover");
          openPanel(<VegetationCover />);
        } else {
          setSubcatchment(false);
          setChoroplethType("none");
          closePanel();
        }
        return;
      }
      case "soilBurnSeverity": {
        setSbsEnabled(checked);
        return;
      }
      default: {
        return;
      }
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
