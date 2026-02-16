import React from "react";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import SmallScreenNotice from "../../components/SmallScreenNotice";
import { useNavigate } from "@tanstack/react-router";
import watar_diagram from "../../assets/images/watar_diagram.png";
import "../about/About.css";

/* ABOUT WATAR: SIDE PANEL CONTENT */
export function AboutWatarSidePanelContent() {
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <button
        onClick={() => {
          navigate({ to: "/about" });
        }}
        className="closeButton"
        aria-label="Close WATAR panel"
        title="Close WATAR panel"
        style={{ padding: "0.313rem 0.5rem" }}
      >
        BACK
      </button>

      <h2>About WATAR</h2>
      <hr />
      <div id="nutshell">
        <h3>IN A NUTSHELL</h3>
        <p>
          <span>What it is:</span>&nbsp; WATAR (
          <em>Wildfire Ash Transport and Risk</em>) is a modeling framework
          designed to predict how wildfire ash is mobilized by runoff and
          delivered to streams and water supplies after a fire.
        </p>
        <p>
          <span>Purpose:</span>&nbsp; Developed to help land and water managers
          better understand and reduce the risks that post-fire ash poses to
          water quality, infrastructure, and municipal water systems
        </p>
        <p>
          <span>How it works:</span>&nbsp; Operates as an extension of
          WEPPcloud, using hydrologic simulations as a foundation while
          explicitly accounting for wildfire ash
        </p>
      </div>

      <br />
      <br />
      <br />
    </div>
  );
}

/* ABOUT WATAR: MAIN CONTENT */
export function AboutWatarMainContent() {
  return (
    <div id="about-container-main">
      <img
        src={watar_diagram}
        alt="diagram of inputs, processes and outputs of WATAR"
      />

      <h2>Purpose and Applications</h2>
      <p>
        <strong>WATAR (Wildfire Ash Transport and Risk)</strong> is a modeling
        framework designed to predict how wildfire ash is mobilized by runoff
        and delivered to streams and water supplies after a fire. The model was
        developed to help land and water managers better understand and reduce
        the risks that post-fire ash poses to water quality, infrastructure, and
        municipal water systems.
      </p>
      <p>
        WATAR is built on extensive field measurements, laboratory experiments,
        and Earth observation (satellite) data collected after wildfires in the
        western United States. It operates as an extension of WEPPcloud, using
        WEPP’s hydrologic simulations as a foundation while explicitly
        accounting for the unique behavior of wildfire ash.
      </p>

      <div className="text-center dash">&mdash;</div>

      <h2>What the Model Does</h2>
      <p>
        WATAR simulates how ash moves across hillslopes and into water systems
        over time by:
      </p>

      <ul>
        <li>
          Ingesting <span>post-fire ash load and ash cover maps</span> derived
          from satellite imagery
        </li>
        <li>
          Using <span>WEPP-simulated runoff and infiltration</span> to drive ash
          transport
        </li>
        <li>
          Tracking how ash availability and transport change across{" "}
          <span>multiple rainfall and snowmelt events</span>
        </li>
      </ul>

      <p>
        Unlike traditional erosion models that treat post-fire material as
        mineral soil, WATAR treats ash as a distinct material with different
        physical and chemical properties.
      </p>

      <div className="text-center dash">&mdash;</div>

      <h2>Key Concepts Behind WATAR</h2>
      <ul>
        <li>
          <span>Ash changes runoff behavior:</span>
          <br />
          After a fire, ash forms a porous layer that can temporarily store
          water while limiting infiltration into the soil below. This affects
          how much runoff is generated and when ash is mobilized.
        </li>
        <li>
          <span>Ash transport evolves over time:</span>
          <br />
          Early storms tend to move large amounts of fine ash. As storms
          continue, ash becomes compacted, depleted, and less easily
          transported.
        </li>
        <li>
          <span>Finite ash supply:</span>
          <br />
          WATAR explicitly accounts for the fact that ash is a limited source
          that is gradually removed by successive runoff events.
        </li>
        <li>
          <span>Event-driven behavior:</span>
          <br />
          Transport depends on rainfall intensity, timing, and ash condition,
          allowing the model to capture realistic post-fire pulses of ash
          delivery.
        </li>
      </ul>

      <div className="text-center dash">&mdash;</div>

      <h2>Model Outputs</h2>
      <p>WATAR provides time-series estimates of:</p>
      <ul>
        <li>Ash export from hillslopes</li>
        <li>Cumulative ash delivery to water systems</li>
        <li>
          First-order estimates of <span>water quality impacts</span>, based on
          the fraction of fine ash most likely to dissolve and release chemical
          constituents.
        </li>
      </ul>

      <p>
        These outputs help identify{" "}
        <strong>when and where ash poses the greatest risk</strong> following a
        wildfire.
      </p>

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
  return (
    <div className="side-panel">
      <div className="side-panel-content">{children}</div>
    </div>
  );
}

/**
 * Layout for the ABOUT WATAR page.
 */
export default function AboutWATAR() {
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className="about-container">
      <SidePanel>
        <AboutWatarSidePanelContent />
      </SidePanel>
      <div className="about-wrapper" style={{ position: "relative" }}>
        <AboutWatarMainContent />
      </div>
    </div>
  );
}
