import React from "react";
import { tss } from "../utils/tss";
import { commonStyles, subPageStyles } from "../utils/sharedStyles";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import { useNavigate } from "@tanstack/react-router";
import sbs_diagram from "../assets/images/sbs_diagram.png";

const useStyles = tss.create(({ theme }) => ({
  ...commonStyles(theme),
  ...subPageStyles(theme),
}));

/* ABOUT SBS: SIDE PANEL CONTENT */
export function AboutSBSSidePanelContent() {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <button
        onClick={() => {
          navigate({ to: "/about" });
        }}
        className={classes.closeButton}
        aria-label="Close SBS panel"
        title="Close SBS panel"
        style={{ padding: "0.313rem 0.5rem" }}
      >
        BACK
      </button>

      <h2>About Predicted-SBS</h2>
      <hr />
      <div className={classes.nutshell}>
        <h3>IN A NUTSHELL</h3>
        <p>
          <span>What it is:</span>&nbsp; The p-SBS tool is a model-based
          forecast of potential soil burn severity derived from pre-fire
          vegetation, soil, terrain, climate, and disturbance conditions.
        </p>
        <p>
          <span>Purpose:</span>&nbsp; Intended to support proactive planning and
          risk assessment, enabling managers to anticipate areas of higher soil
          vulnerability before a fire occurs.
        </p>
        <p>
          <span>How it works:</span>&nbsp; Using a multi-source dataset and
          machine-learning models, the p-SBS Tool generates forecasted maps that
          classify soil burn severity into low, moderate, and high categories.
        </p>
      </div>

      <br />
      <br />
      <br />
    </div>
  );
}

/* ABOUT SBS: MAIN CONTENT */
export function AboutSBSMainContent() {
  const { classes } = useStyles();
  return (
    <div className={classes.aboutContainerMain}>
      <img
        src={sbs_diagram}
        alt="diagram of inputs, processes and outputs of p-SBS"
      />

      <h2>What is Soil Burn Severity?</h2>
      <p>
        Soil Burn Severity (SBS) is the extent to which the heat from a wildfire
        changes the hydrological, physical, and chemical properties of soil.
        These changes influence watershed stability, vegetation recovery, and
        the risk of post-fire erosion. In operational contexts, USDA Forest
        Service BAER teams use the term to refer to a standardized mapping
        product. This map is a field-validated, satellite-derived image created
        by comparing pre-fire and post-fire imagery to classify severity across
        a burned area.
      </p>

      <div className={`${classes.textCenter} ${classes.dash}`}>&mdash;</div>

      <h2>
        Predicted SBS Tool
        <br />
        Purpose and Applications
      </h2>
      <p>
        The predicted-Soil Burn Severity (p-SBS) tool extends the concept of SBS
        into the pre-fire environment to provide a model-based forecast of
        potential severity. Its purpose is to enable proactive planning and risk
        assessment, allowing managers to anticipate areas with higher soil
        vulnerability before a fire happens rather than reacting only after
        impacts occur.
      </p>
      <p>
        The p-SBS tool supports strategic, pre-emptive wildfire management and
        risk reduction by moving assessment from reactive mapping to proactive
        forecasting. Specific applications include:
      </p>
      <ul>
        <li>Pre-fire fuel and land-management planning.</li>
        <li>Mitigating erosion and watershed risks.</li>
        <li>
          Using anticipatory severity mapping to guide resource allocation.
        </li>
      </ul>

      <div className={`${classes.textCenter} ${classes.dash}`}>&mdash;</div>

      <h2>What the Model Does</h2>
      <p>
        The tool addresses soil burn severity prediction as a supervised
        multi-class classification problem (low, moderate, high). It utilizes
        ensemble machine-learning models, with Random Forest emerging as the
        best performer among those evaluated. A feature selection process
        reduced the initial dataset to 21 top predictors to maximize
        performance. The strongest drivers of severity were found to be terrain
        exposure (elevation), atmospheric aridity (ESI, ETa), and vegetation
        moisture and biomass (NDMI, NDVI).
      </p>

      <div className={`${classes.textCenter} ${classes.dash}`}>&mdash;</div>

      <h2>Model Inputs and Outputs</h2>
      <p>
        The framework uses a multi-source dataset for inputs spanning several
        categories:
      </p>

      <h3>Inputs</h3>
      <ul>
        <li>
          <span>Remote Sensing & Vegetation:</span>
          <br />
          Pre-fire imagery from Landsat 8 to compute indices like NDVI and NDMI,
          and ECOSTRESS products like evapotranspiration, evaporative stress
          index, and surface soil moisture.
        </li>
        <li>
          <span>Soil & Topography:</span>
          <br />
          Terrain metrics derived from SRTM (e.g., slope, elevation) and soil
          properties from POLARIS (e.g., saturated hydaulic conductivity,
          plant-available water).
        </li>
        <li>
          <span>Climate & Anthropogenic Factors:</span>
          <br />
          Climatological data from Daymet v4 and GridMET (e.g., temperature,
          precipitation, dead fuel moisture), alongside human disturbance
          variables like prior burn history, distance to roads, streams,
          ignition sources.
        </li>
      </ul>

      <h3>Outputs</h3>
      <ul>
        <li>
          The model outputs{" "}
          <span>forecasted maps representing potential soil burn severity</span>
          . It classifies severity into low, moderate, and high categories, with
          particular skill in detecting high-severity burns, which are critical
          for hazard mitigation.
        </li>
      </ul>

      <br />
      <br />
      <br />
    </div>
  );
}

/**
 * SidePanel component
 */
function SidePanel({ children }: { children: React.ReactNode }) {
  const { classes } = useStyles();
  return (
    <div className={classes.sidePanel}>
      <div className={classes.sidePanelContent}>{children}</div>
    </div>
  );
}

/**
 * Layout for the ABOUT SBS page.
 */
export default function AboutSBS() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.aboutContainer}>
      <SidePanel>
        <AboutSBSSidePanelContent />
      </SidePanel>
      <div className={classes.aboutWrapper} style={{ position: "relative" }}>
        <AboutSBSMainContent />
      </div>
    </div>
  );
}
