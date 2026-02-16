import React from "react";
import { useIsSmallScreen } from "../../hooks/useIsSmallScreen";
import SmallScreenNotice from "../../components/SmallScreenNotice";
import { useNavigate } from "@tanstack/react-router";
import scenarios_diagram from "../../assets/images/scenarios_diagram.png";
import "../about/About.css";

/* SCENARIOS: SIDE PANEL CONTENT */
export function ScenariosSidePanelContent() {
  const navigate = useNavigate();
  return (
    <div className="about-panel">
      <button
        onClick={() => {
          navigate({ to: "/about" });
        }}
        className="closeButton"
        aria-label="Close Scenarios panel"
        title="Close Scenarios panel"
        style={{ padding: "0.313rem 0.5rem" }}
      >
        BACK
      </button>

      <h2>Model Scenarios</h2>
      <hr />
      <p>
        Scenarios are used to explore "what-if" conditions that affect watershed
        erosion, runoff, and water quality. By simulating specific combinations
        of land conditions, climate settings, and management actions—such as
        thinning treatments versus wildfire impacts—scenarios provide a fast,
        low-cost way to compare alternatives and evaluate potential risks
        without waiting for real-world outcomes.
      </p>
      <br />
      <br />
      <br />
    </div>
  );
}

/* SCENARIOS: MAIN CONTENT */
export function ScenariosMainContent() {
  return (
    <div id="about-container-main">
      <img src={scenarios_diagram} alt="diagram of scenarios modeling" />
      <h2>What are Scenarios?</h2>
      <p>
        Scenarios are used to explore “what-if” conditions that affect erosion,
        runoff, and water quality. A scenario represents a specific combination
        of land condition, disturbance, management action, and climate setting.
        By comparing scenarios, users can quickly evaluate how different
        choices—or future conditions—may influence watershed outcomes.
      </p>
      <p>
        Scenarios are a core concept of the Water Erosion Prediction Project (
        <a href="about-wepp">WEPP</a>) model and provide a fast, low-cost way to
        test alternatives without waiting for real-world outcomes. They are
        widely used as decision-support tools by land and water resource
        managers.
      </p>

      <div className="text-center dash">&mdash;</div>

      <h2>Disturbance and Management Scenarios</h2>
      <p>
        These scenarios describe how the landscape is affected by forest
        treatments or wildfire severity. They are commonly used to compare
        erosion and water quality risks under different management strategies.
        Thinning, prescribed fire, and wildfire scenarios (low, moderate, and
        high severity) are applied uniformly across all hillslopes in a
        watershed. While such uniform conditions are unlikely to occur in
        reality, this approach provides managers with a consistent way to
        evaluate relative risk, compare management alternatives, and understand
        the potential upper bounds of erosion and water quality impacts.
      </p>
      <ul>
        <li>
          <span>Undisturbed (Baseline)</span>
          <br />
          Represents typical, healthy forest conditions with full ground cover.
          This scenario provides a reference point for comparing all other
          scenarios.
        </li>
        <li>
          <span>Thinning Treatments (Hand, Cable, Skidder)</span>
          Simulate mechanical fuel treatments with varying levels of ground
          disturbance. These scenarios help evaluate the short-term erosion
          impacts of fuel reduction treatments, which are generally much lower
          than those from wildfires.
        </li>
        <li>
          <span>Prescribed Fire</span>
          <br />
          Represents planned, low-intensity burning that reduces ground cover
          more than thinning but far less than uncontrolled wildfire. Used to
          compare fire-based fuel management with mechanical treatments.
        </li>
        <li>
          <span>Low-, Moderate-, and High-Severity Wildfire</span>
          <br />
          Simulate increasing levels of vegetation and ground cover loss.
          <ul>
            <li>Low severity reflects limited soil disturbance</li>
            <li>Moderate severity represents partial soil exposure</li>
            <li>
              High severity represents worst-case conditions, with major erosion
              and water quality impacts
            </li>
          </ul>
        </li>
        <li>
          <span>Simulated Wildfire</span>
          <br />
          Based on a simulated wildfire (<a href="about-sbs">p-SBS</a>)
        </li>
      </ul>

      <div className="text-center dash">&mdash;</div>

      <h2>How Scenarios are Used</h2>
      <p>
        Each scenario represents a complete WEPP simulation. Behind the scenes,
        WEPP organizes vegetation, soil conditions, surface disturbance, and
        management actions into structured inputs. Some soil and management
        parameters—including critical shear stress, hydraulic conductivity, and
        rill and interrill erodibility—are automatically adjusted based on land
        cover or disturbance type and soil texture. These default values are
        derived from field observations and experimental studies conducted
        across the western United States, ensuring that scenario simulations
        reflect realistic post-disturbance soil behavior.
      </p>
      <p>By comparing results across scenarios, users can:</p>
      <ul>
        <li>Identify areas of high erosion or water quality risk</li>
        <li>
          Evaluate the benefits of fuel treatments versus wildfire impacts
        </li>
        <li>Support planning, mitigation, and emergency response decisions</li>
      </ul>

      <div className="text-center dash">&mdash;</div>

      <h2>Who Uses Scenario-Based Modeling?</h2>
      <p>Scenario-based WEPP modeling is uses by:</p>
      <ul>
        <li>Land and watershed managers</li>
        <li>USDA Forest Service and NRCS</li>
        <li>Bureau of Land Management (BLM)</li>
        <li>Post-fire emergency response teams (BAER, ES)</li>
        <li>State agencies and water utilities</li>
        <li>Scientists and researchers</li>
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
  return (
    <div className="side-panel">
      <div className="side-panel-content">{children}</div>
    </div>
  );
}

/**
 * Layout for the Scenarios page.
 */
export default function Scenarios() {
  const isSmallScreen = useIsSmallScreen();

  if (isSmallScreen) {
    return <SmallScreenNotice />;
  }

  return (
    <div className="about-container">
      <SidePanel>
        <ScenariosSidePanelContent />
      </SidePanel>
      <div className="about-wrapper" style={{ position: "relative" }}>
        <ScenariosMainContent />
      </div>
    </div>
  );
}
