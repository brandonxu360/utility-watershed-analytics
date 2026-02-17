import { tss } from "../utils/tss";
import { commonStyles, navStyles } from "../utils/sharedStyles";
import { useIsSmallScreen } from "../hooks/useIsSmallScreen";
import { Link, useNavigate } from "@tanstack/react-router";
import SmallScreenNotice from "../components/SmallScreenNotice";
import wsu from "../assets/images/wsu_logo_horiz.png";
import ui from "../assets/images/ui_logo_light_horiz.png";
import unr from "../assets/images/unr_logo.png";
import osu from "../assets/images/osu_logo.png";
import usfs from "../assets/images/usfs_rockyMtn_logo.png";
import firewise_diagram from "../assets/images/firewise_diagram.png";
import fire_image from "../assets/images/wildfire-threat-water-supply.jpg";

const useStyles = tss.create(({ theme }) => ({
  ...commonStyles(theme),
  ...navStyles(theme),
  btnLink: {
    background: theme.palette.common.black,
    padding: "8px 16px",
    border: `1px solid ${theme.palette.accent.main}`,
    borderRadius: 4,
    color: theme.palette.accent.main,
    "&:hover": {
      background: theme.palette.accent.main,
      padding: "8px 16px",
      borderRadius: 4,
      color: theme.palette.common.white,
    },
  },
  institutions: {
    "& img": {
      width: 220,
      margin: "2rem auto",
    },
  },
  box_txt: {
    border: `1px solid ${theme.palette.divider}`,
    padding: "20px",
  },
  row: {
    display: "block",
    marginTop: 0,
    marginRight: "calc(-.5 * 1.5rem)",
    marginLeft: "calc(-.5 * 1.5rem)",
  },
  col: {
    "@media screen and (min-width: 1201px)": {
      width: "50%",
      padding: "0.3rem 2rem",
      display: "inline-block",
      verticalAlign: "top",
    },
    "@media screen and (max-width: 1200px)": {
      width: "100%",
      padding: "0.3rem 2rem",
      display: "inline-block",
      verticalAlign: "top",
    },
  },
}));

/* ABOUT: SIDE PANEL CONTENT */
export function AboutSidePanelContent() {
  const { classes } = useStyles();
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <h2>About the Project</h2>
      <p>
        This product was supported by NASA and builds upon individual components
        developed over many years with funding from multiple state and federal
        agencies.
      </p>
      <br />
      <p>
        <Link to="/" className={classes.btnLink}>
          Explore Watersheds
        </Link>
      </p>
      <br />
      <h2>Model Architecture</h2>

      <div className={classes.navButtons} style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => {
            navigate({ to: "/about-wepp" });
          }}
          className={classes.actionButton}
          aria-label="Learn about WEPP"
          title="Learn about WEPP"
        >
          WEPP
        </button>

        <button
          onClick={() => {
            navigate({ to: "/about-wepp-cloud" });
          }}
          className={classes.actionButton}
          aria-label="Learn about WEPPcloud"
          title="Learn about WEPPcloud"
        >
          WEPPcloud
        </button>

        <button
          onClick={() => {
            navigate({ to: "/about-rhessys" });
          }}
          className={classes.actionButton}
          aria-label="Learn about RHESSys"
          title="Learn about RHESSys"
        >
          RHESSys
        </button>

        <button
          onClick={() => {
            navigate({ to: "/about-sbs" });
          }}
          className={classes.actionButton}
          aria-label="Learn about Predicted SBS"
          title="Learn about Predicted SBS"
        >
          Predicted Soil Burn Severity
        </button>

        <button
          onClick={() => {
            navigate({ to: "/about-watar" });
          }}
          className={classes.actionButton}
          aria-label="Learn about WATAR"
          title="Learn about WATAR"
        >
          Wildfire Ash Transport And Risk (WATAR)
        </button>

        <button
          onClick={() => {
            navigate({ to: "/scenarios" });
          }}
          className={classes.actionButton}
          aria-label="Learn about Scenarios"
          title="Learn about Scenarios"
        >
          Scenarios
        </button>
      </div>

      <br />

      <div className={classes.institutions}>
        <h2>Participating Institutions</h2>
        <p className={classes.textCenter}>
          <img src={wsu} alt="Washington State University logo" />
        </p>
        <p>
          <img src={ui} alt="University of Idaho logo" />
        </p>
        <p>
          <img src={unr} alt="University of Nevada, Reno logo" />
        </p>
        <p>
          <img src={osu} alt="Oregon State University logo" />
        </p>
        <p>
          <img
            src={usfs}
            alt="US Forest Service, Rocky Mountain Research logo"
          />
        </p>
      </div>
    </div>
  );
}

/* ABOUT: MAIN CONTENT */
export function AboutMainContent() {
  const { classes } = useStyles();
  return (
    <div className={classes.aboutContainerMain}>
      <h2>FireWISE Watersheds Overview</h2>

      <div className={classes.row}>
        <div className={classes.col}>
          <p className={classes.textCenter}>
            <img src={fire_image} />
          </p>
        </div>
        <div className={classes.col}>
          <p className={classes.box_txt}>
            <strong>
              FireWISE (Water, Impacts, Scenarios, Erosion) Watersheds
            </strong>{" "}
            is a decision-support tool for water utilities that conveniently
            brings together climatological, hydrological, and environmental data
            into a predictive modeling tool, allowing users to explore{" "}
            <strong>short-term changes</strong> in post-disturbance runoff,
            erosion, and ash transport, and{" "}
            <strong>longer-term watershed recovery dynamics</strong>
            by assessing vegetation regrowth in watersheds across the western
            US.
          </p>
        </div>
      </div>

      <div className={classes.row}>
        <div className={classes.col}>
          <p>
            Wildfires are increasingly recognized as a threat to water supply.
            Fires have the potential to increase erosion and runoff in
            watersheds which can create threaten water quality for millions of
            people in the western US who rely on forested watersheds for clean
            drinking water. Targeted watershed management before fires can help
            reduce the negative effects of wildfire, and prime forests to
            weather fires and recover from fire events more robustly.
          </p>
        </div>
        <div className={classes.col}>
          <p>
            Developed in partnership with Pacific Northwest water utilities,{" "}
            <strong>FireWISE Watersheds</strong> is designed to be used by
            managers for <a href="scenarios">scenario-based planning</a>,
            real-time analysis, and long-term resilience assessments. It is
            designed to guide preparedness, treatment operations, and watershed
            management decisions following wildfire disturbances.
          </p>
        </div>
      </div>

      <h2>Underlying Architecture</h2>
      <div className={classes.row}>
        <div className={classes.col}>
          <p>
            This platform uses two models to provide a predictive tool that can
            integrate wildfire behavior modeling, ecohydrologic simulations, and
            post-fire erosion and ash transport processes within a unified
            interface:
          </p>
          <table>
            <tbody>
              <tr>
                <td>
                  <p className={classes.textCenter}>
                    <a href="about-wepp" className={classes.btnLink}>
                      WEPP
                    </a>
                    &nbsp;
                  </p>
                </td>
                <td>
                  <p>Watershed Erosion Prediction Project</p>
                </td>
              </tr>
              <tr>
                <td>
                  <p>
                    <a href="about-rhessys" className={classes.btnLink}>
                      RHESSys
                    </a>
                    &nbsp;
                  </p>
                </td>
                <td>
                  <p>Regional HydroEcological Simulation System</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className={classes.col}>
          <p>
            Leveraging NASA Earth observations—including Landsat, Sentinel-2,
            SMAP soil moisture, and MODIS vegetation metrics—along with advanced
            modeling systems such as <a href="about-rhessys">RHESSys-WMFire</a>,
            <a href="about-wepp">WEPP</a>, and <a href="about-watar">WATAR</a>,
            users can explore how different watershed burn severity affects ash
            deposition, streamflow, sediment loads, changes in forest biomass,
            and nitrogen leaching.
          </p>
        </div>
      </div>

      <div>
        <br />
        <img src={firewise_diagram} alt="diagram" />
        <br />
        <p className={classes.textCenter}>
          Building FireWISE Watersheds for water utility decision support
        </p>
      </div>

      <br />
      <br />
    </div>
  );
}

/**
 * Layout for the ABOUT page.
 */
export default function About() {
  const { classes } = useStyles();
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className={classes.aboutContainer}>
      <div className={classes.sidePanel}>
        <div className={classes.sidePanelContent}>
          <AboutSidePanelContent />
        </div>
      </div>
      <div className={classes.aboutWrapper} style={{ position: "relative" }}>
        <AboutMainContent />
      </div>
    </div>
  );
}
