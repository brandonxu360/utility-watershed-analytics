import { tss } from "../utils/tss";
import { commonStyles, subPageStyles } from "../utils/sharedStyles";
import { useNavigate } from "@tanstack/react-router";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import SmallScreenNotice from "../components/SmallScreenNotice";
import weppcloud_diagram from "../assets/images/weppcloud_diagram.png";

const useStyles = tss.create(({ theme }) => ({
  ...commonStyles(theme),
  ...subPageStyles(theme),
}));

/* ABOUT WEPPCLOUD: SIDE PANEL CONTENT */
export function AboutWeppCloudSidePanelContent() {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <button
        onClick={() => {
          navigate({ to: "/about" });
        }}
        className={classes.closeButton}
        aria-label="Close WEPPcloud panel"
        title="Close WEPPcloud panel"
        style={{ padding: "0.313rem 0.5rem", marginBottom: "1rem" }}
      >
        BACK
      </button>

      <h2>About WEPPcloud</h2>
      <hr />
      <div className={classes.nutshell}>
        <h3>IN A NUTSHELL</h3>
        <p>
          <span>What it is:</span>&nbsp; WEPPcloud is an online interface for
          the <a href="about-wepp">WEPP watershed model</a>, built on a Python
          software framework (wepppy).
        </p>
        <p>
          <span>Purpose:</span>&nbsp; WEPPcloud is designed as a
          decision-support tool that makes the WEPP model more accessible to
          land managers and practitioners.
        </p>
        <p>
          <span>How it works:</span>&nbsp; WEPPcloud runs entirely through a web
          browser and stores all model runs on remote cloud servers, eliminating
          local computing and storage limitations.
        </p>
      </div>

      <br />
      <br />
      <br />
    </div>
  );
}

/* ABOUT WEPPCLOUD: MAIN CONTENT */
export function AboutWeppCloudMainContent() {
  const { classes } = useStyles();
  return (
    <div className={classes.aboutContainerMain}>
      <img
        src={weppcloud_diagram}
        alt="diagram of inputs, processes and outputs of WEPP Cloud"
      />

      <h2>How WEPPcloud is Used</h2>
      <h3>Automated Input Creation</h3>
      <ul>
        <li>
          Automatically gathers and processes input data from publicly available
          databases
        </li>
        <li>
          Uses sources such as SSURGO/STATSGO2 for soils and USGS NLCD for land
          cover
        </li>
      </ul>

      <h3>Watershed Delineation</h3>
      <ul>
        <li>
          Delineates watersheds into hillslopes and channels using tools such as
          TOPAZ or TauDEM
        </li>
      </ul>

      <h3>Enhanced Modeling Capabilities</h3>
      <ul>
        <li>Includes baseflow simulation using a linear reservoir approach</li>
        <li>
          Supports pollutant load modeling, including phosphorus loss estimates
        </li>
        <li>Provides ash transport modeling</li>
      </ul>

      <h3>Scenario Analysis</h3>
      <p>
        Allows users to evaluate management alternatives and disturbance
        scenarios, such as:
      </p>

      <ul>
        <li>Undisturbed conditions</li>
        <li>Forest thinning</li>
        <li>Prescribed fire</li>
        <li>Varying wildfire severities</li>
      </ul>

      <h3>Output Visualization</h3>
      <ul>
        <li>
          Results are provided in tabular, graphical, and GIS formats, including
          shapefiles
        </li>
        <li>
          Users can visualize and compare outputs such as soil loss and sediment
          yield maps
        </li>
      </ul>

      <div className={`${classes.textCenter} ${classes.dash}`}>&mdash;</div>

      <h2>Who Uses WEPPcloud</h2>
      <p>
        WEPPcloud is designed for users who may not have extensive modeling
        experience, including:
      </p>
      <ul>
        <li>Land and water resource managers</li>
        <li>USDA Forest Service Burned Area Emergency Response (BAER) teams</li>
        <li>Department of the Interior Emergency Stabilization teams</li>
        <li>State agencies</li>
        <li>Water utilities</li>
      </ul>

      <p>
        It also supports scientists and researchers by providing a
        comprehensive, physically based hydrologic modeling framework with
        pre-processed data.
      </p>
    </div>
  );
}

function SidePanel({ children }: { children: React.ReactNode }): JSX.Element {
  const { classes } = useStyles();
  return (
    <div className={classes.sidePanel}>
      <div className={classes.sidePanelContent}>{children}</div>
    </div>
  );
}

/**
 * Layout for the ABOUT WEPPCLOUD page.
 */
export default function AboutWeppCloud() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.aboutContainer}>
      <SidePanel>
        <AboutWeppCloudSidePanelContent />
      </SidePanel>
      <div className={classes.aboutWrapper} style={{ position: "relative" }}>
        <AboutWeppCloudMainContent />
      </div>
    </div>
  );
}
