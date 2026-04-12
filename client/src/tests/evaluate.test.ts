import { describe, it, expect } from "vitest";
import {
  evaluate,
  selectOrderedActiveIds,
  isDesiredButBlocked,
} from "../layers/evaluate";
import { INITIAL_DESIRED, INITIAL_RUNTIME, applyAction } from "../layers/rules";
import { LAYER_REGISTRY } from "../layers/registry";
import type { DesiredMap, LayerRuntime } from "../layers/types";

// Helpers
function fresh(): DesiredMap {
  return JSON.parse(JSON.stringify(INITIAL_DESIRED));
}

function freshRuntime(): LayerRuntime {
  return JSON.parse(JSON.stringify(INITIAL_RUNTIME));
}

describe("evaluate", () => {
  // ─── Basic pass-through ────────────────────────────────────────────────

  it("initial desired → only default-on layers are effectively enabled", () => {
    const eff = evaluate(fresh(), freshRuntime());
    for (const [id, state] of Object.entries(eff)) {
      if (id === "channels") {
        expect(state.enabled).toBe(true);
      } else {
        expect(state.enabled).toBe(false);
      }
      expect(state.blockedReasons).toEqual([]);
      expect(state.loading).toBe(false);
    }
  });

  it("enabled layer with no constraints passes through", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const eff = evaluate(desired, freshRuntime());
    expect(eff.channels.enabled).toBe(true);
    expect(eff.channels.blockedReasons).toEqual([]);
  });

  // ─── Data availability blocking ───────────────────────────────────────

  it("blocks a layer when dataAvailability is false", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      dataAvailability: { channels: false },
    };
    const eff = evaluate(desired, runtime);
    expect(eff.channels.enabled).toBe(false);
    expect(eff.channels.blockedReasons).toEqual([
      { kind: "missing-data", detail: "WEPP Channels data is not available" },
    ]);
  });

  it("does NOT block when dataAvailability is undefined (not checked yet)", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    // dataAvailability.channels is undefined (default)
    const eff = evaluate(desired, freshRuntime());
    expect(eff.channels.enabled).toBe(true);
  });

  it("does NOT block when dataAvailability is true", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      dataAvailability: { channels: true },
    };
    const eff = evaluate(desired, runtime);
    expect(eff.channels.enabled).toBe(true);
  });

  // ─── Required-layer blocking ──────────────────────────────────────────

  it("blocks landuse when subcatchment effective is disabled (missing data)", () => {
    // User enables landuse (which auto-enables subcatchment via rules)
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "landuse",
      on: true,
    });
    expect(desired.subcatchment.enabled).toBe(true);
    expect(desired.landuse.enabled).toBe(true);

    // But subcatchment data is unavailable at runtime
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      dataAvailability: { subcatchment: false },
    };
    const eff = evaluate(desired, runtime);
    // subcatchment blocked by missing data
    expect(eff.subcatchment.enabled).toBe(false);
    // landuse blocked because subcatchment is blocked
    expect(eff.landuse.enabled).toBe(false);
    expect(eff.landuse.blockedReasons).toContainEqual({
      kind: "requires-layer",
      layerId: "subcatchment",
    });
  });

  // ─── Zoom blocking ────────────────────────────────────────────────────
  // Currently no layers have zoomRange in the registry, but the evaluator
  // supports it. We test the code path with a synthetic scenario.

  it("blocks a layer when zoom is out of range", () => {
    // Temporarily add a zoom range to the mutable registry object
    const originalZoomRange = LAYER_REGISTRY.channels.zoomRange;
    LAYER_REGISTRY.channels.zoomRange = { min: 10, max: 18 };

    try {
      const desired = applyAction(fresh(), {
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
      const runtime: LayerRuntime = { ...freshRuntime(), zoom: 8 };
      const eff = evaluate(desired, runtime);
      expect(eff.channels.enabled).toBe(false);
      expect(eff.channels.blockedReasons).toContainEqual({
        kind: "zoom-out-of-range",
        current: 8,
        required: { min: 10, max: 18 },
      });
    } finally {
      LAYER_REGISTRY.channels.zoomRange = originalZoomRange;
    }
  });

  // ─── Loading flag ─────────────────────────────────────────────────────

  it("sets loading=true when runtime.loading is true (does NOT block)", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      loading: { subcatchment: true },
    };
    const eff = evaluate(desired, runtime);
    expect(eff.subcatchment.enabled).toBe(true); // not blocked
    expect(eff.subcatchment.loading).toBe(true);
  });

  it("loading=false by default", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
    const eff = evaluate(desired, freshRuntime());
    expect(eff.subcatchment.loading).toBe(false);
  });

  // ─── Opacity pass-through ─────────────────────────────────────────────

  it("passes through opacity from desired", () => {
    let desired = applyAction(fresh(), { type: "TOGGLE", id: "sbs", on: true });
    desired = applyAction(desired, {
      type: "SET_OPACITY",
      id: "sbs",
      opacity: 0.4,
    });
    const eff = evaluate(desired, freshRuntime());
    expect(eff.sbs.opacity).toBe(0.4);
  });

  // ─── Multiple blocking reasons accumulate ─────────────────────────────

  it("accumulates multiple blocked reasons", () => {
    // landuse requires subcatchment and its own data
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "landuse",
      on: true,
    });
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      dataAvailability: { subcatchment: false, landuse: false },
    };
    const eff = evaluate(desired, runtime);
    expect(eff.landuse.enabled).toBe(false);
    // Should have both: missing own data + requires blocked
    expect(eff.landuse.blockedReasons.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── selectOrderedActiveIds ──────────────────────────────────────────────────

describe("selectOrderedActiveIds", () => {
  it("returns enabled layers sorted by zIndex", () => {
    let desired = fresh();
    desired = applyAction(desired, {
      type: "TOGGLE",
      id: "subcatchment",
      on: true,
    });
    desired = applyAction(desired, {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const eff = evaluate(desired, freshRuntime());
    const ordered = selectOrderedActiveIds(eff);
    expect(ordered).toEqual(["subcatchment", "channels"]);
    // subcatchment zIndex=400 < channels zIndex=410
  });

  it("returns only default-on layers when using initial desired", () => {
    const eff = evaluate(fresh(), freshRuntime());
    expect(selectOrderedActiveIds(eff)).toEqual(["channels"]);
  });
});

// ─── isDesiredButBlocked ─────────────────────────────────────────────────────

describe("isDesiredButBlocked", () => {
  it("returns true when user wants it on but it is blocked", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const runtime: LayerRuntime = {
      ...freshRuntime(),
      dataAvailability: { channels: false },
    };
    const eff = evaluate(desired, runtime);
    expect(isDesiredButBlocked("channels", desired, eff)).toBe(true);
  });

  it("returns false when desired and effective agree", () => {
    const desired = applyAction(fresh(), {
      type: "TOGGLE",
      id: "channels",
      on: true,
    });
    const eff = evaluate(desired, freshRuntime());
    expect(isDesiredButBlocked("channels", desired, eff)).toBe(false);
  });

  it("returns false when desired is off", () => {
    const desired = fresh();
    const eff = evaluate(desired, freshRuntime());
    expect(isDesiredButBlocked("channels", desired, eff)).toBe(false);
  });
});
