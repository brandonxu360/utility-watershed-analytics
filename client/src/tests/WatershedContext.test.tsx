import React, { type ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { INITIAL_DESIRED, INITIAL_RUNTIME } from "../layers/rules";
import { WatershedProvider, useWatershed } from "../contexts/WatershedContext";
import { WatershedTestWrapper } from "./helpers/WatershedTestWrapper";

describe("WatershedContext", () => {
  it("throws when used outside WatershedProvider", () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useWatershed())).toThrow(
      "useWatershed must be used within a <WatershedProvider>",
    );
    spy.mockRestore();
  });

  it("provides initial desired and runtime state", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    expect(result.current.layerDesired).toEqual(INITIAL_DESIRED);
    expect(result.current.layerRuntime).toEqual(INITIAL_RUNTIME);
    expect(result.current.selectedHillslopeId).toBeNull();
  });

  it("toggles a layer on via dispatchLayerAction", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });

    expect(result.current.layerDesired.channels.enabled).toBe(true);
  });

  it("toggles a layer off", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: false,
      });
    });

    expect(result.current.layerDesired.channels.enabled).toBe(false);
  });

  it("sets layer opacity via dispatchLayerAction", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "SET_OPACITY",
        id: "subcatchment",
        opacity: 0.5,
      });
    });

    expect(result.current.layerDesired.subcatchment.opacity).toBe(0.5);
  });

  it("sets a layer param via dispatchLayerAction", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "SET_PARAM",
        id: "choropleth",
        key: "year",
        value: 2020,
      });
    });

    expect(result.current.layerDesired.choropleth.params.year).toBe(2020);
  });

  it("enables layer with params via enableLayerWithParams", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.enableLayerWithParams("scenario", {
        scenario: "undisturbed",
        variable: "runoff",
      });
    });

    expect(result.current.layerDesired.scenario.enabled).toBe(true);
    expect(result.current.layerDesired.scenario.params.scenario).toBe(
      "undisturbed",
    );
    expect(result.current.layerDesired.scenario.params.variable).toBe("runoff");
    // auto-enables required subcatchment
    expect(result.current.layerDesired.subcatchment.enabled).toBe(true);
  });

  it("resets state on runId change (skips first render)", () => {
    let runId = "run-1";
    const wrapper = ({ children }: { children: ReactNode }) =>
      React.createElement(WatershedProvider, { runId, children });

    const { result, rerender } = renderHook(() => useWatershed(), { wrapper });

    // Mutate state
    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });
    expect(result.current.layerDesired.channels.enabled).toBe(true);

    // Change runId → triggers RESET
    runId = "run-2";
    rerender();

    expect(result.current.layerDesired.channels.enabled).toBe(false);
    expect(result.current.layerDesired).toEqual(INITIAL_DESIRED);
  });

  it("does NOT reset on first render", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    // State should be initial without reset being triggered
    expect(result.current.layerDesired).toEqual(INITIAL_DESIRED);
    expect(result.current.selectedHillslopeId).toBeNull();
  });

  it("sets data availability via setDataAvailability", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setDataAvailability("channels", true);
    });

    expect(result.current.layerRuntime.dataAvailability.channels).toBe(true);
  });

  it("sets data availability to false", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setDataAvailability("channels", false);
    });

    expect(result.current.layerRuntime.dataAvailability.channels).toBe(false);
  });

  it("sets data availability to undefined (not checked)", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setDataAvailability("channels", undefined);
    });

    expect(
      result.current.layerRuntime.dataAvailability.channels,
    ).toBeUndefined();
  });

  it("sets layer loading via setLayerLoading", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setLayerLoading("channels", true);
    });

    expect(result.current.layerRuntime.loading.channels).toBe(true);

    act(() => {
      result.current.setLayerLoading("channels", false);
    });

    expect(result.current.layerRuntime.loading.channels).toBe(false);
  });

  it("sets zoom via setZoom", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setZoom(15);
    });

    expect(result.current.layerRuntime.zoom).toBe(15);
  });

  it("sets selected hillslope via setSelectedHillslope", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setSelectedHillslope(42);
    });

    expect(result.current.selectedHillslopeId).toBe(42);
  });

  it("sets selected hillslope to null", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setSelectedHillslope(42);
    });

    act(() => {
      result.current.setSelectedHillslope(null);
    });

    expect(result.current.selectedHillslopeId).toBeNull();
  });

  it("clears selected hillslope via clearSelectedHillslope", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.setSelectedHillslope(42);
    });

    act(() => {
      result.current.clearSelectedHillslope();
    });

    expect(result.current.selectedHillslopeId).toBeNull();
  });

  it("derives effective state from desired + runtime", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    // All disabled initially
    expect(result.current.effective.channels.enabled).toBe(false);
    expect(result.current.activeIds).toEqual([]);

    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });

    expect(result.current.effective.channels.enabled).toBe(true);
    expect(result.current.activeIds).toContain("channels");
  });

  it("isBlocked returns true when data unavailable blocks a layer", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    // Enable channels, then mark data unavailable
    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });

    act(() => {
      result.current.setDataAvailability("channels", false);
    });

    expect(result.current.isBlocked("channels")).toBe(true);
    expect(result.current.isEffective("channels")).toBe(false);
  });

  it("isBlocked returns false when desired is off", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    expect(result.current.isBlocked("channels")).toBe(false);
  });

  it("isEffective returns true for enabled layer with no blocks", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatchLayerAction({
        type: "TOGGLE",
        id: "channels",
        on: true,
      });
    });

    expect(result.current.isEffective("channels")).toBe(true);
  });

  it("raw dispatch works for arbitrary actions", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    act(() => {
      result.current.dispatch({ type: "SET_ZOOM", zoom: 12 });
    });

    expect(result.current.layerRuntime.zoom).toBe(12);
  });

  it("reducer returns same state for unknown action type", () => {
    const { result } = renderHook(() => useWatershed(), {
      wrapper: WatershedTestWrapper,
    });

    const stateBefore = result.current.layerDesired;

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.current.dispatch({ type: "UNKNOWN_ACTION" } as any);
    });

    expect(result.current.layerDesired).toEqual(stateBefore);
  });
});
