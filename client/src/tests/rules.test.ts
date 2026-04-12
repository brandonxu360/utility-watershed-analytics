import { describe, it, expect } from "vitest";
import {
  applyAction,
  enableWithParams,
  INITIAL_DESIRED,
} from "../layers/rules";
import type { DesiredMap } from "../layers/types";

// Helper: get a fresh copy of initial state for each test
function fresh(): DesiredMap {
  return JSON.parse(JSON.stringify(INITIAL_DESIRED));
}

describe("rules – applyAction", () => {
  // ─── TOGGLE ON ─────────────────────────────────────────────────────────

  describe("TOGGLE on", () => {
    it("enables a standalone layer (channels)", () => {
      const next = applyAction(fresh(), {
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
      expect(next.channels.enabled).toBe(true);
    });

    it("auto-enables required layers (landuse → subcatchment)", () => {
      const next = applyAction(fresh(), {
        type: "TOGGLE",
        id: "landuse",
        on: true,
      });
      expect(next.landuse.enabled).toBe(true);
      expect(next.subcatchment.enabled).toBe(true);
    });

    it("auto-enables required layers (choropleth → subcatchment)", () => {
      const next = applyAction(fresh(), {
        type: "TOGGLE",
        id: "choropleth",
        on: true,
      });
      expect(next.choropleth.enabled).toBe(true);
      expect(next.subcatchment.enabled).toBe(true);
    });

    it("enforces exclusive group: enabling landuse disables choropleth and sbs", () => {
      let state = fresh();
      state = applyAction(state, {
        type: "TOGGLE",
        id: "choropleth",
        on: true,
      });
      expect(state.choropleth.enabled).toBe(true);

      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      expect(state.landuse.enabled).toBe(true);
      expect(state.choropleth.enabled).toBe(false);
      expect(state.sbs.enabled).toBe(false);
    });

    it("enforces exclusive group: enabling sbs disables landuse and choropleth", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      expect(state.landuse.enabled).toBe(true);

      state = applyAction(state, { type: "TOGGLE", id: "sbs", on: true });
      expect(state.sbs.enabled).toBe(true);
      expect(state.landuse.enabled).toBe(false);
      expect(state.choropleth.enabled).toBe(false);
      // subcatchment is auto-torn-down because no other layer requires it
      expect(state.subcatchment.enabled).toBe(false);
      // channels stays on (default-on)
      expect(state.channels.enabled).toBe(true);
    });

    it("does not affect layers in other groups", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: true });
      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      // channels is in 'overlays' group — should still be on
      expect(state.channels.enabled).toBe(true);
      expect(state.landuse.enabled).toBe(true);
    });

    it("enabling an already-enabled layer is a no-op (idempotent)", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: true });
      const before = { ...state };
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: true });
      expect(state.channels).toEqual(before.channels);
    });
  });

  // ─── TOGGLE OFF ────────────────────────────────────────────────────────

  describe("TOGGLE off", () => {
    it("disables a standalone layer", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: true });
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: false });
      expect(state.channels.enabled).toBe(false);
    });

    it("disabling subcatchment also disables dependents (landuse, choropleth)", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      expect(state.subcatchment.enabled).toBe(true);
      expect(state.landuse.enabled).toBe(true);

      state = applyAction(state, {
        type: "TOGGLE",
        id: "subcatchment",
        on: false,
      });
      expect(state.subcatchment.enabled).toBe(false);
      expect(state.landuse.enabled).toBe(false);
    });

    it("disabling a layer does not affect unrelated layers", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: true });
      state = applyAction(state, { type: "TOGGLE", id: "sbs", on: true });
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: false });
      expect(state.sbs.enabled).toBe(true);
    });

    it("disabling a dependency tears down requirements of its now-disabled dependents", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      expect(state.landuse.enabled).toBe(true);
      expect(state.subcatchment.enabled).toBe(true);
      expect(state.channels.enabled).toBe(true);

      // Disabling channels should cascade: landuse loses channels (a requirement)
      // so landuse is disabled, and then subcatchment—only needed by landuse—
      // should also be torn down.
      state = applyAction(state, { type: "TOGGLE", id: "channels", on: false });
      expect(state.channels.enabled).toBe(false);
      expect(state.landuse.enabled).toBe(false);
      expect(state.subcatchment.enabled).toBe(false);
    });
  });

  // ─── SET_OPACITY ───────────────────────────────────────────────────────

  describe("SET_OPACITY", () => {
    it("updates opacity without changing enabled or params", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "sbs", on: true });
      state = applyAction(state, {
        type: "SET_OPACITY",
        id: "sbs",
        opacity: 0.5,
      });
      expect(state.sbs.opacity).toBe(0.5);
      expect(state.sbs.enabled).toBe(true);
      expect(state.sbs.params).toEqual({ mode: "legacy" });
    });
  });

  // ─── SET_PARAM ─────────────────────────────────────────────────────────

  describe("SET_PARAM", () => {
    it("sets a param without changing enabled or opacity", () => {
      let state = fresh();
      state = applyAction(state, {
        type: "TOGGLE",
        id: "choropleth",
        on: true,
      });
      state = applyAction(state, {
        type: "SET_PARAM",
        id: "choropleth",
        key: "metric",
        value: "evapotranspiration",
      });
      expect(state.choropleth.params.metric).toBe("evapotranspiration");
      expect(state.choropleth.enabled).toBe(true);
    });

    it("merges params (does not clobber other keys)", () => {
      let state = fresh();
      state = applyAction(state, {
        type: "TOGGLE",
        id: "choropleth",
        on: true,
      });
      state = applyAction(state, {
        type: "SET_PARAM",
        id: "choropleth",
        key: "year",
        value: 2020,
      });
      expect(state.choropleth.params.metric).toBe("vegetationCover"); // untouched
      expect(state.choropleth.params.year).toBe(2020);
    });
  });

  // ─── RESET ─────────────────────────────────────────────────────────────

  describe("RESET", () => {
    it("restores all layers to initial state", () => {
      let state = fresh();
      state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
      state = applyAction(state, {
        type: "SET_OPACITY",
        id: "sbs",
        opacity: 0.3,
      });
      state = applyAction(state, { type: "RESET" });

      for (const [id, layerState] of Object.entries(state)) {
        expect(layerState).toEqual(INITIAL_DESIRED[id as keyof DesiredMap]);
      }
    });
  });
});

// ─── enableWithParams ────────────────────────────────────────────────────────

describe("rules – enableWithParams", () => {
  it("enables choropleth with metric param and auto-enables subcatchment", () => {
    const state = fresh();
    const next = enableWithParams(state, "choropleth", {
      metric: "evapotranspiration",
    });
    expect(next.choropleth.enabled).toBe(true);
    expect(next.choropleth.params.metric).toBe("evapotranspiration");
    expect(next.subcatchment.enabled).toBe(true);
  });

  it("disables exclusive-group siblings when enabling via params", () => {
    let state = fresh();
    state = applyAction(state, { type: "TOGGLE", id: "landuse", on: true });
    const next = enableWithParams(state, "choropleth", {
      metric: "vegetationCover",
    });
    expect(next.choropleth.enabled).toBe(true);
    expect(next.landuse.enabled).toBe(false);
  });
});
